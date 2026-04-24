import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, useAuth } from '../../contexts/AuthContext';
import { collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Quiz, Question } from '../../types';
import { Trash2, Save, ArrowLeft, Plus } from 'lucide-react';

export default function AdminQuizBuilder() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  
  const isNew = !quizId || quizId === 'new';
  
  const [formData, setFormData] = useState<Partial<Quiz>>({
    title: '', description: '', classLevel: 'Class 10', subject: 'Mathematics', topic: '', durationMinutes: 10, totalQuestions: 0
  });

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isNew) {
      loadData();
    }
  }, [quizId]);

  const loadData = async () => {
    try {
      const qDoc = await getDoc(doc(db, 'quizzes', quizId as string));
      if (qDoc.exists()) setFormData({ id: qDoc.id, ...qDoc.data() } as Quiz);

      const qsSnap = await getDocs(collection(db, `quizzes/${quizId}/questions`));
      setQuestions(qsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Question)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleQuizSave = async () => {
    if (!userProfile) return;
    setSaving(true);
    try {
      const quizPayload = {
        title: formData.title,
        description: formData.description,
        classLevel: formData.classLevel,
        subject: formData.subject,
        topic: formData.topic,
        durationMinutes: Number(formData.durationMinutes),
        totalQuestions: questions.length, // Sync question length
      };

      if (isNew) {
        const docRef = await addDoc(collection(db, 'quizzes'), {
          ...quizPayload,
          createdAt: serverTimestamp(),
          createdBy: userProfile.uid,
        });
        navigate(`/admin/quizzes/${docRef.id}`);
      } else {
        await updateDoc(doc(db, 'quizzes', quizId as string), quizPayload);
        alert('Quiz updated!');
      }
    } catch (e) {
      console.error(e);
      alert('Error saving.');
    } finally {
      setSaving(false);
    }
  };

  const addQuestion = async () => {
    if (isNew) {
      alert("Please save the quiz details first.");
      return;
    }
    const qPayload = {
      quizId: quizId,
      text: 'New Question',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctOptionIndex: 0,
      explanation: ''
    };
    try {
      const qRef = await addDoc(collection(db, `quizzes/${quizId}/questions`), qPayload);
      setQuestions([...questions, { id: qRef.id, ...qPayload }]);
      
      // Update the main quiz's totalQuestions
      await updateDoc(doc(db, 'quizzes', quizId!), {
        totalQuestions: questions.length + 1
      });
      setFormData(prev => ({ ...prev, totalQuestions: questions.length + 1 }));
    } catch (e) {
      console.error(e);
    }
  };

  const updateQuestionState = (idx: number, updates: Partial<Question>) => {
    const updatedQs = [...questions];
    updatedQs[idx] = { ...updatedQs[idx], ...updates };
    setQuestions(updatedQs);
  };

  const handleQuestionSave = async (idx: number) => {
    try {
      const q = questions[idx];
      const payload = {
        quizId: quizId,
        text: q.text,
        options: q.options,
        correctOptionIndex: Number(q.correctOptionIndex),
        explanation: q.explanation || ''
      };
      await updateDoc(doc(db, `quizzes/${quizId}/questions`, q.id), payload);
      alert('Question saved!');
    } catch (e) {
      console.error(e);
      alert('Error saving question.');
    }
  };

  const handleDeleteQuestion = async (idx: number) => {
    if (confirm("Delete this question?")) {
      const q = questions[idx];
      try {
        await deleteDoc(doc(db, `quizzes/${quizId}/questions`, q.id));
        const newQs = questions.filter((_, i) => i !== idx);
        setQuestions(newQs);
        await updateDoc(doc(db, 'quizzes', quizId!), {
          totalQuestions: newQs.length
        });
        setFormData(prev => ({ ...prev, totalQuestions: newQs.length }));
      } catch (e) {
        console.error(e);
      }
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/admin')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{isNew ? 'Create New Quiz' : 'Edit Quiz'}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quiz Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <input 
                className="w-full p-2 border rounded"
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
                placeholder="e.g. Current Alternating" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Topic</label>
              <input 
                className="w-full p-2 border rounded"
                value={formData.topic} 
                onChange={e => setFormData({...formData, topic: e.target.value})} 
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea 
              className="w-full p-2 border rounded h-20"
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Class Level</label>
              <select className="w-full p-2 border rounded" value={formData.classLevel} onChange={e => setFormData({...formData, classLevel: e.target.value})}>
                {['Class 7', 'Class 8', 'Class 9', 'Class 10'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <select className="w-full p-2 border rounded" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})}>
                {['Mathematics', 'Science', 'Social Science', 'Hindi', 'English'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Duration (Minutes)</label>
              <input type="number" className="w-full p-2 border rounded" value={formData.durationMinutes} onChange={e => setFormData({...formData, durationMinutes: Number(e.target.value)})} />
            </div>
          </div>
          <Button onClick={handleQuizSave} disabled={saving} className="w-full">
            <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving...' : 'Save Details'}
          </Button>
        </CardContent>
      </Card>

      {!isNew && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">Questions ({questions.length})</h2>
            <div className="flex gap-2">
              <Button onClick={() => {
                const csv = prompt("Paste CSV text (format: Question,OptionA,OptionB,OptionC,OptionD,CorrectIndex0-3,Explanation)");
                if (!csv) return;
                const rows = csv.split('\n');
                rows.forEach(async (row) => {
                  const cols = row.split(',');
                  if (cols.length >= 6) {
                    const qPayload = {
                      quizId: quizId,
                      text: cols[0],
                      options: [cols[1], cols[2], cols[3], cols[4]],
                      correctOptionIndex: Number(cols[5]) || 0,
                      explanation: cols[6] || ''
                    };
                    try {
                      await addDoc(collection(db, `quizzes/${quizId}/questions`), qPayload);
                    } catch (e) {
                      console.error('Failed to parse row', row);
                    }
                  }
                });
                alert("Importing... Please wait a moment then refresh.");
                setTimeout(() => window.location.reload(), 2000);
              }} variant="outline" className="border-slate-300">
                Bulk CSV
              </Button>
              <Button onClick={addQuestion} variant="outline" className="border-slate-300">
                <Plus className="h-4 w-4 mr-2" /> Add Question
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {questions.map((q, idx) => (
              <Card key={q.id || idx} className="bg-slate-50 relative">
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="font-bold flex-shrink-0 mt-2 text-slate-400">Q{idx + 1}</div>
                    <div className="flex-1 space-y-4">
                      <textarea 
                        className="w-full p-3 border rounded-md shadow-sm h-auto bg-white"
                        value={q.text}
                        onChange={e => updateQuestionState(idx, { text: e.target.value })}
                        placeholder="Question Text"
                        rows={2}
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-2">
                            <input 
                              type="radio" 
                              name={`correct-${q.id}`} 
                              checked={q.correctOptionIndex === oIdx}
                              onChange={() => updateQuestionState(idx, { correctOptionIndex: oIdx })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <input 
                              className="flex-1 p-2 border rounded text-sm bg-white"
                              value={opt}
                              onChange={e => {
                                const newOpts = [...q.options];
                                newOpts[oIdx] = e.target.value;
                                updateQuestionState(idx, { options: newOpts });
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      <input 
                        className="w-full p-2 border rounded text-sm bg-white"
                        value={q.explanation || ''}
                        onChange={e => updateQuestionState(idx, { explanation: e.target.value })}
                        placeholder="Explanation (Optional)"
                      />
                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteQuestion(idx)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </Button>
                        <Button size="sm" onClick={() => handleQuestionSave(idx)}>Save Change</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
