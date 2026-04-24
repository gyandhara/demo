import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/Button';
import { BookOpen, LogOut, Home, User, Settings, Trophy } from 'lucide-react';

export default function Navbar() {
  const { userProfile, signOut, loading, currentUser } = useAuth();
  const navigate = useNavigate();

  if (loading) return null;

  return (
    <>
      {/* Desktop Top Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10 w-full px-4 h-16 flex items-center justify-between">
        <div 
          className="flex items-center gap-2 font-bold text-xl text-blue-600 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <BookOpen className="h-6 w-6" />
          <span className="hidden sm:inline-block">Gyan Dhara Vidyapeeth</span>
          <span className="sm:hidden">GDV</span>
        </div>
        
        <div className="flex items-center gap-4">
          {userProfile && (
            <>
              {userProfile.role === 'admin' ? (
                <Button variant="ghost" onClick={() => navigate('/admin')}>
                  Admin Panel
                </Button>
              ) : (
                <Button variant="ghost" className="hidden md:inline-flex" onClick={() => navigate('/leaderboard')}>
                  <Trophy className="h-4 w-4 mr-2" /> Leaderboard
                </Button>
              )}
              <div className="hidden md:flex items-center gap-2 text-sm text-slate-600 font-medium bg-slate-100 py-1.5 px-3 rounded-full">
                <User className="h-4 w-4" />
                <span>{userProfile.displayName}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate('/'); }}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </>
          )}
          {!currentUser && (
            <Button size="sm" onClick={() => navigate('/')}>Login</Button>
          )}
        </div>
      </nav>

      {/* Mobile Bottom Navbar (Appears only on mobile if logged in as student) */}
      {userProfile && userProfile.role === 'student' && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center h-16 z-20 pb-safe">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex flex-col items-center justify-center w-full h-full text-slate-500 hover:text-blue-600 focus:text-blue-600"
          >
            <Home className="h-5 w-5 mb-1" />
            <span className="text-[10px] uppercase font-semibold">Home</span>
          </button>
          <button 
            onClick={() => navigate('/quizzes')}
            className="flex flex-col items-center justify-center w-full h-full text-slate-500 hover:text-blue-600 focus:text-blue-600"
          >
            <BookOpen className="h-5 w-5 mb-1" />
            <span className="text-[10px] uppercase font-semibold">Quizzes</span>
          </button>
          <button 
            onClick={() => navigate('/leaderboard')}
            className="flex flex-col items-center justify-center w-full h-full text-slate-500 hover:text-blue-600 focus:text-blue-600"
          >
            <Trophy className="h-5 w-5 mb-1" />
            <span className="text-[10px] uppercase font-semibold">Rank</span>
          </button>
        </div>
      )}
    </>
  );
}
