import { useEffect, useState } from 'react';
import { db } from '../contexts/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Quiz } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Clock, HelpCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function QuizList() {
  const [searchParams] = useSearchParams();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  const subjectFilter = searchParams.get('subject');
  const classFilter = searchParams.get('classLevel') || userProfile?.classLevel;

  useEffect(() => {
    async function fetchQuizzes() {
      setLoading(true);
      try {
        let q = query(
          collection(db, 'quizzes'),
          orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        let docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quiz));

        if (classFilter) docs = docs.filter(q => q.classLevel === classFilter);
        if (subjectFilter) docs = docs.filter(q => q.subject === subjectFilter);

        setQuizzes(docs);
      } catch (error) {
        console.error("Error fetching quizzes", error);
      } finally {
        setLoading(false);
      }
    }
    fetchQuizzes();
  }, [subjectFilter, classFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {subjectFilter ? `${subjectFilter} Quizzes` : 'All Quizzes'}
        </h1>
        <p className="text-slate-500 mt-1">{classFilter || 'All Classes'}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12 text-slate-500">Loading quizzes...</div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
          <p className="text-lg text-slate-500">No quizzes found for this criteria.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/quizzes')}>View All Quizzes</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <Card key={quiz.id} className="flex flex-col hover:border-blue-300 hover:shadow-md transition-all">
              <CardHeader>
                <div className="flex items-center justify-between mb-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
                  <span>{quiz.subject}</span>
                  <span className="bg-blue-50 px-2 py-1 rounded">{quiz.classLevel}</span>
                </div>
                <CardTitle className="text-xl">{quiz.title}</CardTitle>
                <CardDescription className="line-clamp-2">{quiz.description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto pt-4 flex-1 flex flex-col justify-end gap-4">
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <div className="flex items-center gap-1">
                    <HelpCircle className="h-4 w-4" />
                    <span>{quiz.totalQuestions} Qs</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{quiz.durationMinutes} mins</span>
                  </div>
                </div>
                <Button className="w-full" onClick={() => navigate(`/quiz/${quiz.id}`)}>
                  Start Quiz
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
