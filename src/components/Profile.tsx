import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { UserCircle, Phone, GraduationCap, School, Target, Trash2, AlertCircle, Coins, Crown, BookmarkCheck } from 'lucide-react';

interface Profile {
  full_name: string;
  phone: string;
  education: string;
  target_exam: string;
  tokens: number;
  account_type: 'free' | 'premium';
}

interface SavedQuestion {
  id: string;
  exam_type: string;
  subject: string;
  question_text: string;
  question_type: string;
  options?: string[];
  correct_answer: string;
  explanation?: string;
  difficulty: string;
  created_at: string;
}

export default function Profile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    full_name: '',
    phone: '',
    education: '',
    target_exam: '',
    tokens: 0,
    account_type: 'free'
  });
  const [savedQuestions, setSavedQuestions] = useState<SavedQuestion[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadProfile();
  }, [user]);

  async function loadProfile() {
    try {
      if (!user?.id) return;

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      
      if (profileData) {
        setProfile({
          full_name: profileData.full_name || '',
          phone: profileData.phone || '',
          education: profileData.education || '',
          target_exam: profileData.target_exam || '',
          tokens: profileData.tokens || 0,
          account_type: profileData.account_type || 'free'
        });
      }

      const { data: questionsData, error: questionsError } = await supabase
        .from('saved_questions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (questionsError) throw questionsError;
      setSavedQuestions(questionsData || []);

    } catch (error: any) {
      console.error('Error loading profile:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load profile. Please try refreshing the page.',
      });
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...profile,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error: any) {
      console.error('Error saving profile:', error);
      setMessage({
        type: 'error',
        text: 'Failed to save profile. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      const { error } = await supabase
        .from('saved_questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;

      setSavedQuestions(prev => prev.filter(q => q.id !== questionId));
      setMessage({ type: 'success', text: 'Question removed successfully!' });
    } catch (error) {
      console.error('Error deleting question:', error);
      setMessage({ type: 'error', text: 'Failed to delete question' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent"></div>
          <div className="h-4 w-32 mx-auto bg-accent rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Account Status Card */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-xl shadow-sm border border-border mb-6">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-full ${
                  profile.account_type === 'premium' 
                    ? 'bg-yellow-500/20' 
                    : 'bg-blue-500/20'
                }`}>
                  {profile.account_type === 'premium' 
                    ? <Crown className="h-6 w-6 text-yellow-500" />
                    : <Coins className="h-6 w-6 text-blue-500" />
                  }
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-card-foreground">
                    {profile.account_type === 'premium' ? 'Premium Account' : 'Free Account'}
                  </h2>
                  {profile.account_type === 'free' && (
                    <p className="text-sm text-muted-foreground">
                      {profile.tokens} token{profile.tokens === 1 ? '' : 's'} remaining
                    </p>
                  )}
                </div>
              </div>
              {profile.account_type === 'free' && (
                <Button
                  className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700"
                >
                  Upgrade to Premium
                </Button>
              )}
            </div>
          </div>

          {/* Profile Information Card */}
          <div className="bg-card rounded-xl shadow-sm border border-border">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold text-card-foreground">Profile Information</h2>
              <p className="mt-1 text-sm text-muted-foreground">Update your personal details</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {message && (
                <div className={`p-4 rounded-lg border ${
                  message.type === 'success'
                    ? 'bg-green-500/10 border-green-500/20 text-green-500'
                    : 'bg-destructive/10 border-destructive/20 text-destructive'
                }`}>
                  {message.text}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <input
                  type="email"
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-3 py-2 bg-accent/50 border border-border rounded-lg text-muted-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <input
                  type="text"
                  id="full_name"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring text-foreground"
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <input
                  type="tel"
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring text-foreground"
                  placeholder="Enter your phone number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="education">Education</Label>
                <input
                  type="text"
                  id="education"
                  value={profile.education}
                  onChange={(e) => setProfile({ ...profile, education: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring text-foreground"
                  placeholder="e.g., Bachelor's in Engineering"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_exam">Target Exam</Label>
                <input
                  type="text"
                  id="target_exam"
                  value={profile.target_exam}
                  onChange={(e) => setProfile({ ...profile, target_exam: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring text-foreground"
                  placeholder="e.g., GATE 2024"
                />
              </div>

              <Button
                type="submit"
                disabled={saving}
                className="w-full"
              >
                {saving ? 'Saving Changes...' : 'Save Changes'}
              </Button>
            </form>
          </div>
        </div>

        {/* Saved Questions Section */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-xl shadow-sm border border-border">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold text-card-foreground">Saved Questions</h2>
              <p className="mt-1 text-sm text-muted-foreground">Review and manage your saved questions</p>
            </div>

            <div className="p-6">
              {savedQuestions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent flex items-center justify-center">
                    <BookmarkCheck className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-card-foreground">No saved questions yet</h3>
                  <p className="mt-2 text-muted-foreground">
                    Questions you save during practice will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {savedQuestions.map((question) => (
                    <div
                      key={question.id}
                      className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors bg-card"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              question.difficulty === 'EASY'
                                ? 'bg-green-500/20 text-green-500'
                                : question.difficulty === 'MEDIUM'
                                ? 'bg-yellow-500/20 text-yellow-500'
                                : 'bg-red-500/20 text-red-500'
                            }`}>
                              {question.difficulty}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {question.exam_type.replace('_', ' ')} • {question.subject}
                            </span>
                          </div>
                          <p className="text-card-foreground">{question.question_text}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteQuestion(question.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {question.options && (
                        <div className="space-y-2 mb-4">
                          {question.options.map((option, index) => (
                            <div
                              key={index}
                              className={`p-3 rounded-lg border ${
                                option === question.correct_answer
                                  ? 'border-green-500/20 bg-green-500/10'
                                  : 'border-border bg-card'
                              }`}
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                      )}

                      {question.explanation && (
                        <div className="bg-accent/50 border border-border rounded p-3 mt-4">
                          <div className="flex items-center gap-2 text-sm text-card-foreground mb-1">
                            <AlertCircle className="h-4 w-4" />
                            <span className="font-medium">Explanation</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{question.explanation}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}