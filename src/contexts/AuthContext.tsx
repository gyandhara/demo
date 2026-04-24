import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { User } from '../types';

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsStudent: (name: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserClass: (classLevel: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for local student user first
    const storedStudentUser = localStorage.getItem('gdv_student_user');
    if (storedStudentUser) {
      const parsedUser = JSON.parse(storedStudentUser);
      setUserProfile(parsedUser);
      setLoading(false);
      return; 
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setUserProfile(userDoc.data() as User);
          }
        } catch (error) {
          console.error("Error fetching admin profile:", error);
        }
      } else {
        if (!localStorage.getItem('gdv_student_user')) {
           setUserProfile(null);
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    const result = await signInWithPopup(auth, provider);
    
    // Check and create profile if admin
    const userDocRef = doc(db, 'users', result.user.uid);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      const newRole = result.user.email === 'likhoemailidmera@gmail.com' ? 'admin' : 'student';
      const newUserProfile: Omit<User, 'createdAt' | 'updatedAt'> & { createdAt: any; updatedAt: any } = {
        uid: result.user.uid,
        email: result.user.email || '',
        role: newRole,
        displayName: result.user.displayName || 'Admin',
        classLevel: '',
        totalScore: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(userDocRef, newUserProfile);
      setUserProfile(newUserProfile as unknown as User);
    }
  };

  const signInAsStudent = async (name: string) => {
    // Generate a permanent local id so Firestore lets them fetch and submit
    const studentUid = 'std_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    
    // Convert current time to a firestore-like timestamp object so it doesn't break UI locally
    const now = new Date();
    
    const newUserProfile: any = {
      uid: studentUid,
      email: '',
      role: 'student',
      displayName: name,
      classLevel: '',
      totalScore: 0,
      createdAt: { toDate: () => now, seconds: Math.floor(now.getTime() / 1000) }, 
      updatedAt: { toDate: () => now, seconds: Math.floor(now.getTime() / 1000) },
    };

    localStorage.setItem('gdv_student_user', JSON.stringify(newUserProfile));
    setUserProfile(newUserProfile as User);

    try {
      const userDocRef = doc(db, 'users', studentUid);
      // We pass the payload into firestore securely!
      await setDoc(userDocRef, {
        uid: studentUid,
        email: '',
        role: 'student',
        displayName: name,
        classLevel: '',
        totalScore: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch(e) {
      console.warn("Could not save to firestore:", e);
    }
  };

  const signOut = async () => {
    localStorage.removeItem('gdv_student_user');
    setUserProfile(null);
    await firebaseSignOut(auth);
  };

  const updateUserClass = async (classLevel: string) => {
    if (userProfile?.role === 'student' && userProfile.uid.startsWith('std_')) {
      const updated = { ...userProfile, classLevel };
      setUserProfile(updated);
      localStorage.setItem('gdv_student_user', JSON.stringify(updated));
      
      try {
        const userDocRef = doc(db, 'users', userProfile.uid);
        await setDoc(userDocRef, { 
          classLevel, 
          updatedAt: serverTimestamp() 
        }, { merge: true });
      } catch (error) {
        console.error("Error updating user class:", error);
      }
    } else if (currentUser) {
       try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await setDoc(userDocRef, { 
          classLevel, 
          updatedAt: serverTimestamp() 
        }, { merge: true });
        
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as User);
        }
       } catch (error) {
         console.error("Error updating user class:", error);
       }
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading, signInWithGoogle, signInAsStudent, signOut, updateUserClass }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

