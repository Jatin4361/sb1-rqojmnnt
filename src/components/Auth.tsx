import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Chrome } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface AuthProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Auth({ isOpen, onClose }: AuthProps) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (signUpError) throw signUpError;

        // Create initial profile for the user with tokens
        if (signUpData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: signUpData.user.id,
                full_name: '',
                phone: '',
                education: '',
                target_exam: '',
                tokens: 5,
                account_type: 'free'
              },
            ]);
          
          if (profileError) throw profileError;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          if (signInError.message === 'Invalid login credentials') {
            throw new Error('Invalid email or password');
          }
          throw signInError;
        }
      }
      onClose();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) throw error;
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleModeSwitch = () => {
    setIsSignUp(!isSignUp);
    setError(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-card">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-card-foreground">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </DialogTitle>
        </DialogHeader>
        
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/30 text-destructive rounded text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
          >
            <Chrome className="h-4 w-4 mr-2" />
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                placeholder="Enter your email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                placeholder="Enter your password (min 6 characters)"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <div className="text-center">
            <button
              onClick={handleModeSwitch}
              className="text-sm text-primary hover:text-primary/90"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}