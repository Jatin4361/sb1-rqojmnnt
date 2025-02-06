import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { generateQuestions } from '../services/gemini';
import { Question } from '../types';
import { Button } from './ui/button';
import { AlertCircle, Bookmark, BookmarkCheck, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function PracticeMode() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { exam, subject, questionType, questionPattern } = location.state || {};
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingQuestion, setSavingQuestion] = useState<string | null>(null);
  const [savedQuestions, setSavedQuestions] = useState<Set<string>>(new Set());

  const handleStartPractice = async () => {
    if (!exam || !subject) return;

    setLoading(true);
    setError(null);
    try {
      const result = await generateQuestions(
        exam,
        subject,
        questionType,
        questionPattern,
        'practice'
      );
      setQuestions(result.questions);
    } catch (error: any) {
      console.error('Error:', error);
      setError('Failed to generate questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuestion = async (question: Question) => {
    if (!user) {
      setError('Please sign in to save questions');
      return;
    }

    setSavingQuestion(question.id);
    try {
      const { error: saveError } = await supabase
        .from('saved_questions')
        .insert([
          {
            user_id: user.id,
            exam_type: exam,
            subject: subject,
            question_text: question.text,
            question_type: question.type,
            options: question.options,
            correct_answer: question.correctAnswer,
            explanation: question.explanation,
            difficulty: question.difficulty,
          },
        ]);

      if (saveError) throw saveError;
      setSavedQuestions(prev => new Set([...prev, question.id]));
    } catch (error) {
      console.error('Error saving question:', error);
      setError('Failed to save question');
    } finally {
      setSavingQuestion(null);
    }
  };

  if (!exam || !subject) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <h1 className="text-2xl font-bold text-card-foreground mb-4">Invalid Selection</h1>
        <p className="text-muted-foreground mb-8">Please select an exam and subject to continue.</p>
        <Button onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Selection
        </Button>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto py-12">
          <div className="text-center space-y-6">
            <h1 className="text-3xl font-bold text-card-foreground">Practice Mode</h1>
            <p className="text-xl text-muted-foreground">
              {exam.replace('_', ' ')} - {subject}
            </p>
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            <div className="flex justify-center gap-4">
              <Button onClick={() => navigate('/')} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={handleStartPractice} 
                disabled={loading}
                className="min-w-[200px]"
              >
                {loading ? 'Generating Questions...' : 'Start Practice'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto space-y-8 py-12 px-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">Practice Mode</h1>
            <p className="text-muted-foreground">
              {exam.replace('_', ' ')} - {subject}
            </p>
          </div>
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Selection
          </Button>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-8">
          {questions.map((question, index) => (
            <div key={question.id} className="bg-card p-6 rounded-lg shadow-lg border border-border">
              <div className="flex justify-between items-start mb-4">
                <span className="text-lg font-medium text-muted-foreground">Question {index + 1}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSaveQuestion(question)}
                  disabled={savingQuestion === question.id || savedQuestions.has(question.id)}
                  className="text-muted-foreground hover:text-primary"
                >
                  {savingQuestion === question.id ? (
                    <span className="loading">Saving...</span>
                  ) : savedQuestions.has(question.id) ? (
                    <BookmarkCheck className="h-5 w-5" />
                  ) : (
                    <Bookmark className="h-5 w-5" />
                  )}
                </Button>
              </div>

              <p className="text-lg text-card-foreground mb-6">{question.text}</p>

              {question.type === 'MCQ' && question.options && (
                <div className="space-y-3 mb-6">
                  {question.options.map((option) => (
                    <div
                      key={option}
                      className={`p-4 rounded-lg border ${
                        option === question.correctAnswer
                          ? 'border-green-500/20 bg-green-500/10'
                          : 'border-border bg-card'
                      }`}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              )}

              {question.type === 'NUMERICAL' && (
                <div className="mb-6">
                  <div className="p-4 rounded-lg border border-green-500/20 bg-green-500/10">
                    {question.correctAnswer}
                  </div>
                </div>
              )}

              {question.explanation && (
                <div className="bg-accent/50 border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-primary" />
                    <span className="font-medium text-card-foreground">Explanation</span>
                  </div>
                  <p className="text-muted-foreground text-sm">{question.explanation}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}