import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, useAuth } from '../contexts/AuthContext';
import { doc, getDoc, collection, getDocs, setDoc, addDoc, serverTimestamp, increment } from 'firebase/firestore';
import { Quiz, Question } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Clock, AlertCircle } from 'lucide-react';

export default function QuizPlayer() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { userProfile, currentUser } = useAuth();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(true); // Can be a toggle
  
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    async function load() {
      if (!quizId) return;
      try {
        const quizDoc = await getDoc(doc(db, 'quizzes', quizId));
        if (quizDoc.exists()) {
          const qData = { id: quizDoc.id, ...quizDoc.data() } as Quiz;
          setQuiz(qData);
          setTimeLeft(qData.durationMinutes * 60);

          const qSnap = await getDocs(collection(db, `quizzes/${quizId}/questions`));
          const qns = qSnap.docs.map(d => ({ id: d.id, ...d.data() } as Question));
          // Shuffle questions
          setQuestions(qns.sort(() => Math.random() - 0.5));
        }
      } catch (e) {
        console.error("Error loading quiz", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [quizId]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || loading || submitting) return;
    
    timerRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev && prev <= 1) {
          clearInterval(timerRef.current!);
          handleSubmit();
          return 0;
        }
        return prev ? prev - 1 : 0;
      });
    }, 1000);
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft, loading, submitting]);

  const handleSelect = (qId: string, opIdx: number) => {
    setSelectedOptions(prev => ({ ...prev, [qId]: opIdx }));
  };

  const currentQ = questions[currentIdx];
  const isLastQ = currentIdx === questions.length - 1;
  const isAnswered = selectedOptions[currentQ?.id] !== undefined;

  const handleSubmit = async () => {
    if (submitting || !quiz || !userProfile) return;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    let correctCount = 0;
    questions.forEach(q => {
      if (selectedOptions[q.id] === q.correctOptionIndex) {
        correctCount += 1;
      }
    });

    const score = correctCount * 10;

    try {
      // 1. Create Quiz Attempt
      const attemptRef = await addDoc(collection(db, 'quizAttempts'), {
        userId: userProfile.uid,
        quizId: quiz.id,
        score: score,
        totalQuestions: questions.length,
        completedAt: serverTimestamp()
      });

      // 2. Update User Total Score
      const userRef = doc(db, 'users', userProfile.uid);
      await setDoc(userRef, {
        totalScore: increment(score),
        updatedAt: serverTimestamp()
      }, { merge: true });

      if (userProfile.role === 'student' && userProfile.uid.startsWith('std_')) {
        const localData = localStorage.getItem('gdv_student_user');
        if (localData) {
          const p = JSON.parse(localData);
          p.totalScore = (p.totalScore || 0) + score;
          localStorage.setItem('gdv_student_user', JSON.stringify(p));
        }
      }

      navigate(`/result/${attemptRef.id}`);
    } catch (e) {
      console.error("Submission failed", e);
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-slate-500">Loading quiz...</div>;
  if (!quiz || questions.length === 0) return <div className="text-center py-20">Quiz not found or has no questions.</div>;

  const m = Math.floor((timeLeft || 0) / 60);
  const s = (timeLeft || 0) % 60;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-20 z-10">
        <div>
          <h2 className="font-bold text-slate-800 line-clamp-1">{quiz.title}</h2>
          <p className="text-sm text-slate-500">Question {currentIdx + 1} of {questions.length}</p>
        </div>
        <div className={`flex items-center gap-2 font-mono text-lg font-semibold px-3 py-1 rounded-md ${timeLeft! < 60 ? 'text-red-600 bg-red-50' : 'text-slate-700 bg-slate-100'}`}>
          <Clock className="h-5 w-5" />
          {m.toString().padStart(2, '0')}:{s.toString().padStart(2, '0')}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg leading-relaxed">{currentQ.text}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentQ.options.map((opt, idx) => {
            const isSelected = selectedOptions[currentQ.id] === idx;
            // Immediate feedback simulation (optional)
            const isFinished = submitting || (showFeedback && isSelected);
            const isCorrect = currentQ.correctOptionIndex === idx;
            const determineStyle = () => {
              if (showFeedback && isSelected) {
                return isCorrect ? 'border-green-500 bg-green-50 text-green-900' : 'border-red-500 bg-red-50 text-red-900';
              }
              if (isSelected) return 'border-blue-500 bg-blue-50 text-blue-900';
              return 'border-slate-200 hover:border-slate-300 hover:bg-slate-50';
            };

            return (
              <button
                key={idx}
                disabled={isAnswered && showFeedback}
                onClick={() => handleSelect(currentQ.id, idx)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${determineStyle()}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 shrink-0 rounded-full border-2 flex flex-col items-center justify-center text-xs font-bold mt-0.5
                    ${showFeedback && isSelected && isCorrect ? 'border-green-500 bg-green-500 text-white' : ''}
                    ${showFeedback && isSelected && !isCorrect ? 'border-red-500 bg-red-500 text-white' : ''}
                    ${!showFeedback && isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300 text-slate-500'}
                  `}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <div>{opt}</div>
                </div>
              </button>
            );
          })}
          
          {showFeedback && isAnswered && currentQ.explanation && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800 flex gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-blue-600" />
              <div>
                <span className="font-semibold block mb-1">Explanation:</span>
                {currentQ.explanation}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-between border-t py-4">
          <Button 
            variant="outline" 
            onClick={() => setCurrentIdx(p => Math.max(0, p - 1))}
            disabled={currentIdx === 0}
          >
            Previous
          </Button>
          {!isLastQ ? (
            <Button 
              onClick={() => setCurrentIdx(p => p + 1)}
            >
              Next Question
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? 'Auto-saving...' : 'Submit Quiz'}
            </Button>
          )}
        </CardFooter>
      </Card>
      
      {/* Quick Jump Bar */}
      <div className="flex flex-wrap gap-2 justify-center mt-6">
        {questions.map((q, idx) => (
          <button 
            key={idx}
            onClick={() => setCurrentIdx(idx)}
            className={`w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center border transition-all ${
              currentIdx === idx ? 'ring-2 ring-blue-600 ring-offset-2' : ''
            } ${
              selectedOptions[q.id] !== undefined ? 'bg-blue-100 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-500'
            }`}
          >
            {idx + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
