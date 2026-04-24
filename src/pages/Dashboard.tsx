import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../contexts/AuthContext';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { QuizAttempt } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { Trophy, Star, Target, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [recentAttempts, setRecentAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAttempts() {
      if (!userProfile?.uid) return;
      try {
        const attemptsQuery = query(
          collection(db, 'quizAttempts'),
          where('userId', '==', userProfile.uid),
          orderBy('completedAt', 'desc'),
          limit(5)
        );
        const snapshot = await getDocs(attemptsQuery);
        const attemptsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuizAttempt));
        setRecentAttempts(attemptsData);
      } catch (error) {
        console.error("Error fetching attempts:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAttempts();
  }, [userProfile]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Welcome back, {userProfile?.displayName?.split(' ')[0]}!
          </h1>
          <p className="text-slate-500 mt-1">{userProfile?.classLevel} • Gyan Dhara Vidyapeeth</p>
        </div>
        <Button onClick={() => navigate('/quizzes')} className="gap-2">
          Start Practicing <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Score</p>
                <p className="text-4xl font-bold mt-1">{userProfile?.totalScore}</p>
              </div>
              <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                <Trophy className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-violet-500 to-purple-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-violet-100 text-sm font-medium">Quizzes Completed</p>
                <p className="text-4xl font-bold mt-1">{recentAttempts.length > 0 ? recentAttempts.length + '+' : '0'}</p>
              </div>
              <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-400 to-orange-500 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">Badges Earned</p>
                <p className="text-4xl font-bold mt-1">{Math.floor((userProfile?.totalScore || 0) / 100)}</p>
              </div>
              <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                <Star className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest quiz attempts</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-4 text-center text-slate-500">Loading activity...</div>
            ) : recentAttempts.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-slate-500 mb-4">No quizzes attempted yet</p>
                <Button variant="outline" onClick={() => navigate('/quizzes')}>Take your first quiz</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentAttempts.map((attempt) => (
                  <div key={attempt.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors cursor-pointer" onClick={() => navigate(`/result/${attempt.id}`)}>
                    <div>
                      <p className="font-medium text-slate-900">{attempt.score}/{attempt.totalQuestions * 10} Points</p>
                      <p className="text-sm text-slate-500">{new Date(attempt.completedAt?.toDate?.() || Date.now()).toLocaleDateString()}</p>
                    </div>
                    <div className="text-blue-600 font-semibold bg-blue-50 px-3 py-1 rounded-full text-sm">
                      {Math.round((attempt.score / (attempt.totalQuestions * 10)) * 100)}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Subjects</CardTitle>
            <CardDescription>Practice by subject</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {['Mathematics', 'Science', 'Social Science', 'Hindi'].map(subject => (
              <button 
                key={subject}
                onClick={() => navigate(`/quizzes?subject=${subject}&classLevel=${userProfile?.classLevel}`)}
                className="flex flex-col items-center justify-center p-6 border-2 border-slate-100 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className="font-medium text-slate-700 group-hover:text-blue-700">{subject}</div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
