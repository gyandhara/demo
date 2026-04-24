import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export default function Landing() {
  const { currentUser, userProfile, signInAsStudent, signInWithGoogle, loading } = useAuth();
  const navigate = useNavigate();
  const [studentName, setStudentName] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (userProfile && !loading) {
      if (userProfile.role === 'admin') {
        navigate('/admin');
      } else if (!userProfile.classLevel) {
        navigate('/setup');
      } else {
        navigate('/dashboard');
      }
    }
  }, [userProfile, loading, navigate]);

  if (loading || (currentUser && !userProfile && isSigningIn)) {
    return <div className="flex justify-center py-20">Loading...</div>;
  }

  const handleStart = async () => {
    if (!studentName.trim()) {
      alert("Please enter your name first.");
      return;
    }
    setIsSigningIn(true);
    try {
      await signInAsStudent(studentName);
    } catch (e: any) {
      console.error(e);
      if (e.code === 'auth/operation-not-allowed') {
        alert("Anonymous authentication is not enabled in Firebase. Please ask the developer to enable it.");
      } else {
        alert("Sign in failed. " + e.message);
      }
      setIsSigningIn(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 mb-6">
        Welcome to <span className="text-blue-600">Gyan Dhara Vidyapeeth</span>
      </h1>
      <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl">
        A gamified learning platform for Class 7-10 students. Take quizzes, earn badges, and track your progress daily!
      </p>
      
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-sm w-full mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Student Access</h2>
        
        <div className="space-y-4 text-left">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Enter your Name</label>
            <input 
              type="text" 
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="e.g. Rahul Kumar"
              value={studentName}
              onChange={e => setStudentName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleStart()}
            />
          </div>
          
          <Button 
            onClick={handleStart} 
            size="lg" 
            disabled={isSigningIn}
            className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700"
          >
            {isSigningIn ? 'Starting...' : 'Start Learning'}
          </Button>
        </div>
        
        <p className="mt-6 text-xs text-slate-500">
          Learn, practice, and compete with friends!
        </p>

        <div className="mt-8 pt-4 border-t border-slate-100">
          <Button variant="ghost" size="sm" onClick={signInWithGoogle} className="text-slate-400 text-xs hover:text-slate-600">
            Admin Login
          </Button>
        </div>
      </div>
    </div>
  );
}

