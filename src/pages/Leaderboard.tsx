import { useEffect, useState } from 'react';
import { db } from '../contexts/AuthContext';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { User } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Trophy, Medal, Award } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Leaderboard() {
  const [leaders, setLeaders] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { userProfile } = useAuth();

  useEffect(() => {
    async function loadLeaders() {
      try {
        const q = query(
          collection(db, 'users'),
          orderBy('totalScore', 'desc'),
          limit(10)
        );
        const snapshot = await getDocs(q);
        setLeaders(snapshot.docs.map(d => ({ ...d.data() } as User)));
      } catch (error) {
        console.error("Error fetching leaderboard", error);
      } finally {
        setLoading(false);
      }
    }
    loadLeaders();
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pt-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-800">Top Students!</h1>
        <p className="text-slate-500 mt-2">Compete with friends and rise to the top.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" /> State Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-slate-500">Loading ranks...</div>
          ) : (
            <div className="space-y-3">
              {leaders.map((leader, i) => (
                <div 
                  key={leader.uid} 
                  className={`flex items-center justify-between p-4 rounded-xl border ${
                    leader.uid === userProfile?.uid 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-white border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold font-mono ${
                      i === 0 ? 'bg-yellow-100 text-yellow-700' :
                      i === 1 ? 'bg-slate-200 text-slate-700' :
                      i === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-slate-50 text-slate-500'
                    }`}>
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 flex items-center gap-2">
                        {leader.displayName} 
                        {leader.uid === userProfile?.uid && <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">You</span>}
                      </p>
                      <p className="text-xs text-slate-500">{leader.classLevel || 'Unspecified'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-lg font-bold text-slate-700">
                    <Award className="h-5 w-5 text-blue-500" />
                    {leader.totalScore}
                  </div>
                </div>
              ))}
              {leaders.length === 0 && (
                <p className="text-center text-slate-500 py-10">No scores yet. Be the first!</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
