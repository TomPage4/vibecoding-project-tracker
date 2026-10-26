import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { loadDemoData } from '../lib/seed';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { toast } from '../components/ui/Toast';
import { Layout, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoadDemoAndLogin = async () => {
    setError('');
    setLoadingDemo(true);
    try {
      await loadDemoData();
      await login('alex@demo.test', 'demo1234');
      toast.success('Demo data loaded! Welcome, Alex.');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to load demo data');
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Layout className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">AI Dev Tracker</CardTitle>
          <CardDescription>
            Enter your email and password, or load demo data to explore
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md border border-destructive/20" role="alert">
                {error}
              </div>
            )}
            <Input
              label="Email"
              type="email"
              placeholder="alex@demo.test"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
            <Input
              label="Password"
              type="password"
              placeholder="demo1234"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Logging in...' : 'Login'}
            </Button>
            
            <div className="relative w-full text-center my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <span className="relative bg-card px-2 text-xs uppercase text-muted-foreground font-semibold">
                Or explore prototype
              </span>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5"
              onClick={handleLoadDemoAndLogin}
              disabled={loadingDemo}
            >
              <Sparkles className="h-4 w-4" />
              {loadingDemo ? 'Preparing Demo...' : 'Load Demo Data & Login'}
            </Button>

            <div className="text-sm text-center text-muted-foreground pt-2">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:underline font-medium">
                Register
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
