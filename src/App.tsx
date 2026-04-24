import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import ClassSelection from './pages/ClassSelection';
import QuizList from './pages/QuizList';
import QuizPlayer from './pages/QuizPlayer';
import QuizResult from './pages/QuizResult';
import Leaderboard from './pages/Leaderboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminQuizBuilder from './pages/admin/AdminQuizBuilder';

function PrivateRoute({ children, requireAdmin }: { children: React.ReactNode, requireAdmin?: boolean }) {
  const { userProfile, loading } = useAuth();
  
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!userProfile) return <Navigate to="/" />;
  
  if (requireAdmin && userProfile.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }
  
  if (!userProfile.classLevel && userProfile.role === 'student' && window.location.pathname !== '/setup') {
    return <Navigate to="/setup" />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col font-sans mb-16 md:mb-0">
          <Navbar />
          <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-6 lg:p-8">
            <Routes>
              <Route path="/" element={<Landing />} />
              
              {/* Student Routes */}
              <Route path="/setup" element={<PrivateRoute><ClassSelection /></PrivateRoute>} />
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/quizzes" element={<PrivateRoute><QuizList /></PrivateRoute>} />
              <Route path="/quiz/:quizId" element={<PrivateRoute><QuizPlayer /></PrivateRoute>} />
              <Route path="/result/:attemptId" element={<PrivateRoute><QuizResult /></PrivateRoute>} />
              <Route path="/leaderboard" element={<PrivateRoute><Leaderboard /></PrivateRoute>} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<PrivateRoute requireAdmin><AdminDashboard /></PrivateRoute>} />
              <Route path="/admin/quizzes/new" element={<PrivateRoute requireAdmin><AdminQuizBuilder /></PrivateRoute>} />
              <Route path="/admin/quizzes/:quizId" element={<PrivateRoute requireAdmin><AdminQuizBuilder /></PrivateRoute>} />
              
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
