import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export default function ClassSelection() {
  const { updateUserClass } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const classes = ['Class 7', 'Class 8', 'Class 9', 'Class 10'];

  const handleSelect = async (classLevel: string) => {
    setLoading(true);
    await updateUserClass(classLevel);
    setLoading(false);
    navigate('/dashboard');
  };

  return (
    <div className="max-w-md mx-auto pt-12">
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Welcome to Gyan Dhara Vidyapeeth</CardTitle>
          <CardDescription>Please select your class to get started</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {classes.map((cls) => (
            <Button
              key={cls}
              variant="outline"
              size="lg"
              className="w-full text-lg h-14 justify-between"
              disabled={loading}
              onClick={() => handleSelect(cls)}
            >
              {cls}
              <span className="text-slate-400">→</span>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
