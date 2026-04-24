import { useEffect, useState } from 'react';
import { db } from '../../contexts/AuthContext';
import { collection, query, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { Quiz } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'quizzes'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setQuizzes(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Quiz)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (quizId: string) => {
    if (confirm("Are you sure you want to delete this quiz? Make sure all questions are deleted first.")) {
      try {
        await deleteDoc(doc(db, 'quizzes', quizId));
        fetchQuizzes();
      } catch (e) {
        console.error(e);
        alert("Delete failed. Check console.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Admin Dashboard</h1>
          <p className="text-slate-500">Manage Quizzes and Content</p>
        </div>
        <Button onClick={() => navigate('/admin/quizzes/new')} className="gap-2 bg-slate-900 hover:bg-slate-800 text-white">
          <PlusCircle className="h-4 w-4" /> Create Quiz
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Quizzes ({quizzes.length})</CardTitle>
          <CardDescription>Click a quiz to edit details and questions.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-slate-500">Loading contents...</div>
          ) : quizzes.length === 0 ? (
            <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              No quizzes created yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-md">
              {quizzes.map(quiz => (
                <div key={quiz.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white hover:bg-slate-50">
                  <div className="mb-4 sm:mb-0">
                    <h3 className="font-semibold text-slate-800">{quiz.title}</h3>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-1">
                      {quiz.classLevel} • {quiz.subject} • {quiz.totalQuestions} Qs
                    </p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/admin/quizzes/${quiz.id}`)} className="flex-1 sm:flex-none">
                      <Pencil className="h-4 w-4 mr-2" /> Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(quiz.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
