import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { QuizAttempt, Quiz } from '../types';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CheckCircle, XCircle, Trophy, ArrowRight } from 'lucide-react';

export default function QuizResult() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResult() {
      if (!attemptId) return;
      try {
        const attemptDoc = await getDoc(doc(db, 'quizAttempts', attemptId));
        if (attemptDoc.exists()) {
          const attemptData = { id: attemptDoc.id, ...attemptDoc.data() } as QuizAttempt;
          setAttempt(attemptData);
          
          const quizDoc = await getDoc(doc(db, 'quizzes', attemptData.quizId));
          if (quizDoc.exists()) {
            setQuiz({ id: quizDoc.id, ...quizDoc.data() } as Quiz);
          }
        }
      } catch (e) {
        console.error("Failed to load result", e);
      } finally {
        setLoading(false);
      }
    }
    loadResult();
  }, [attemptId]);

  if (loading) return <div className="py-20 text-center">Loading results...</div>;
  if (!attempt || !quiz) return <div className="py-20 text-center">Result not found.</div>;

  const maxScore = attempt.totalQuestions * 10;
  const percentage = Math.round((attempt.score / maxScore) * 100);
  
  let resultMsg = "Good Try!";
  let resultColor = "text-amber-500";
  if (percentage >= 80) {
    resultMsg = "Outstanding!";
    resultColor = "text-green-500";
  } else if (percentage >= 60) {
    resultMsg = "Well Done!";
    resultColor = "text-blue-500";
  } else if (percentage < 33) {
    resultMsg = "Needs Improvement";
    resultColor = "text-red-500";
  }

  const correctAnswers = attempt.score / 10;
  const incorrectAnswers = attempt.totalQuestions - correctAnswers;

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8 px-4 text-center">
      <div className="mb-8">
        <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 bg-slate-50 border-4 border-white shadow-xl ring-4 ${
          percentage >= 80 ? 'ring-green-400' : percentage >= 50 ? 'ring-blue-400' : 'ring-amber-400'
        }`}>
          <Trophy className={`h-12 w-12 ${resultColor}`} />
        </div>
        <h1 className="text-4xl font-bold text-slate-800 tracking-tight">{resultMsg}</h1>
        <p className="text-slate-500 mt-2 text-lg">You completed <span className="font-semibold text-slate-700">{quiz.title}</span></p>
      </div>

      <Card className="bg-white/50 backdrop-blur-sm border-slate-200">
        <CardContent className="p-8">
          <div className="grid grid-cols-3 divide-x divide-slate-200">
            <div className="px-4">
              <p className="text-5xl font-black text-slate-800">{percentage}%</p>
              <p className="text-sm font-semibold uppercase tracking-wider text-slate-500 mt-2">Accuracy</p>
            </div>
            <div className="px-4">
              <p className="text-3xl font-bold text-green-600 flex items-center justify-center gap-2">
                <CheckCircle className="h-6 w-6" /> {correctAnswers}
              </p>
              <p className="text-sm font-semibold uppercase tracking-wider text-slate-500 mt-2">Correct</p>
            </div>
            <div className="px-4">
              <p className="text-3xl font-bold text-red-500 flex items-center justify-center gap-2">
                <XCircle className="h-6 w-6" /> {incorrectAnswers}
              </p>
              <p className="text-sm font-semibold uppercase tracking-wider text-slate-500 mt-2">Incorrect</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
        <Button size="lg" variant="outline" onClick={() => navigate('/quizzes')} className="h-14 px-8 text-lg">
          Take Another Quiz
        </Button>
        <Button size="lg" onClick={() => navigate('/dashboard')} className="h-14 px-8 text-lg gap-2">
          Back to Dashboard <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
