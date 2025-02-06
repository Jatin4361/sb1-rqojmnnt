import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Clock, GraduationCap, BookOpen, Calculator, Code, Target, Coins } from 'lucide-react';
import { examSubjects } from '../config/examConfig';
import { ExamType, QuestionType, QuestionPattern } from '../types';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import FAQ from './FAQ';
import SubscriptionDialog from './SubscriptionDialog';

const examIcons = {
  GATE: <Code className="h-12 w-12" />
};

export default function ExamSelection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedExam, setSelectedExam] = useState<ExamType | null>(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [specificTopic, setSpecificTopic] = useState('');
  const [questionType, setQuestionType] = useState<QuestionType>('MCQ');
  const [questionPattern, setQuestionPattern] = useState<QuestionPattern>('THEORETICAL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showSubscribeDialog, setShowSubscribeDialog] = useState(false);
  const [accountType, setAccountType] = useState<'free' | 'premium'>('free');
  const [tokens, setTokens] = useState(5);

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('tokens, account_type')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      if (profile) {
        setTokens(profile.tokens);
        setAccountType(profile.account_type);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleExamSelect = (exam: ExamType) => {
    setSelectedExam(exam);
    setSelectedSubject('');
    setSpecificTopic('');
    setDialogOpen(true);
  };

  const handleStart = () => {
    if (!selectedExam || !selectedSubject) return;

    if (accountType === 'free' && tokens <= 0) {
      setShowSubscribeDialog(true);
      return;
    }

    navigate('/test', {
      state: {
        exam: selectedExam,
        subject: selectedSubject,
        specificTopic: specificTopic.trim(),
        questionType,
        questionPattern,
      },
    });
    setDialogOpen(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 space-y-8 md:space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-4 md:space-y-6 max-w-3xl mx-auto">
        <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full text-primary mb-4">
          <Target className="h-4 w-4 md:h-5 md:w-5 mr-2" />
          <span className="text-sm font-medium">AI-Powered Exam Preparation</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/50">
          Predicting Tomorrow's Exam Today!
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
          Our platform leverages advanced data analytics to predict probable questions for your upcoming exams.
        </p>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 max-w-4xl mx-auto py-4 md:py-8">
        <div className="text-center space-y-2">
          <div className="text-3xl md:text-4xl font-bold text-primary">10+</div>
          <div className="text-sm md:text-base text-muted-foreground">Years of Exam Data</div>
        </div>
        <div className="text-center space-y-2">
          <div className="text-3xl md:text-4xl font-bold text-primary">95%</div>
          <div className="text-sm md:text-base text-muted-foreground">Prediction Accuracy</div>
        </div>
        <div className="text-center space-y-2">
          <div className="text-3xl md:text-4xl font-bold text-primary">50K+</div>
          <div className="text-sm md:text-base text-muted-foreground">Students Helped</div>
        </div>
      </div>

      {/* Account Status */}
      {user && (
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-card rounded-lg shadow-sm border border-border p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-full ${
                  accountType === 'premium' ? 'bg-yellow-500/20' : 'bg-primary/20'
                }`}>
                  <Coins className={`h-5 w-5 md:h-6 md:w-6 ${
                    accountType === 'premium' ? 'text-yellow-500' : 'text-primary'
                  }`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground">
                    {accountType === 'premium' ? 'Premium Account' : 'Free Account'}
                  </h3>
                  {accountType === 'free' && (
                    <p className="text-sm text-muted-foreground">
                      {tokens} token{tokens === 1 ? '' : 's'} remaining
                    </p>
                  )}
                </div>
              </div>
              {accountType === 'free' && (
                <Button
                  onClick={() => setShowSubscribeDialog(true)}
                  className="w-full md:w-auto bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700"
                >
                  Upgrade to Premium
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Test Selection Section */}
      <div className="space-y-6 md:space-y-8">
        <div className="text-center">
          <h2 className="text-xl md:text-2xl font-semibold text-card-foreground">Start Your Test</h2>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            Take a test to assess your preparation
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 duration-200 bg-card"
            onClick={() => handleExamSelect('GATE')}
          >
            <CardHeader>
              <div className="flex justify-center text-primary">
                {examIcons.GATE}
              </div>
              <CardTitle className="text-center text-card-foreground">
                GATE ECE Test
              </CardTitle>
              <CardDescription className="text-center text-muted-foreground">
                20 questions • Timed test • Detailed explanations
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* FAQ Section */}
      <FAQ />

      {/* Configuration Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">Configure Your Test</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Select Subject</Label>
              <Select
                value={selectedSubject}
                onValueChange={setSelectedSubject}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a subject" />
                </SelectTrigger>
                <SelectContent>
                  {examSubjects[selectedExam || 'GATE'].map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specific-topic">Specific Topic (Optional)</Label>
              <input
                id="specific-topic"
                type="text"
                value={specificTopic}
                onChange={(e) => setSpecificTopic(e.target.value)}
                placeholder="e.g., Digital Electronics, Signals"
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring text-foreground"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to cover all topics
              </p>
            </div>

            <div className="space-y-2">
              <Label>Question Pattern</Label>
              <Select
                value={questionPattern}
                onValueChange={(value) => setQuestionPattern(value as QuestionPattern)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="THEORETICAL">Theoretical</SelectItem>
                  <SelectItem value="NUMERICAL">Numerical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleStart} 
              disabled={!selectedSubject}
              className="w-full"
            >
              Start Test
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Subscription Dialog */}
      <SubscriptionDialog 
        isOpen={showSubscribeDialog} 
        onClose={() => setShowSubscribeDialog(false)} 
      />
    </div>
  );
}