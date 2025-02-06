import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { generateQuestions } from '../services/gemini';
import { Question } from '../types';
import { Button } from './ui/button';
import { ArrowLeft, Clock, CheckCircle, XCircle, Bookmark, BookmarkCheck, AlertCircle, Brain } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function TestMode() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { exam, subject, specificTopic, questionType, questionPattern, accountType, tokens, setTokens } = location.state || {};
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20 * 60); // 20 minutes in seconds
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [savedQuestions, setSavedQuestions] = useState<Set<string>>(new Set());
  const [savingQuestion, setSavingQuestion] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStep, setGenerationStep] = useState('');

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (testStarted && !testCompleted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && !testCompleted) {
      handleSubmit();
    }
    return () => clearInterval(timer);
  }, [testStarted, testCompleted, timeLeft]);

  const startTest = async () => {
    if (!exam || !subject) return;

    setLoading(true);
    setError(null);
    setGenerationStep('Analyzing past years data...');
    setGenerationProgress(20);

    try {
      setTimeout(() => {
        setGenerationStep('Identifying question patterns...');
        setGenerationProgress(40);
      }, 1500);

      setTimeout(() => {
        setGenerationStep('Generating probable questions...');
        setGenerationProgress(60);
      }, 3000);

      setTimeout(() => {
        setGenerationStep('Validating questions...');
        setGenerationProgress(80);
      }, 4500);

      const result = await generateQuestions(
        exam,
        subject,
        'MCQ', // Always use MCQ type
        questionPattern,
        'test',
        specificTopic
      );

      // Only deduct token after successful generation
      if (accountType === 'free') {
        try {
          const { error } = await supabase
            .from('profiles')
            .update({ tokens: tokens - 1 })
            .eq('id', user?.id);

          if (error) throw error;
          setTokens(prev => prev - 1);
        } catch (error) {
          console.error('Error updating tokens:', error);
          throw new Error('Failed to update tokens');
        }
      }

      setQuestions(result.questions);
      setTimeLeft(20 * 60);
      setTestStarted(true);
      setTestCompleted(false);
      setAnswers({});
      setMarkedForReview(new Set());
      setSavedQuestions(new Set());
      setGenerationProgress(100);
    } catch (error: any) {
      console.error('Error:', error);
      setError('Failed to generate questions. Please try again.');
    } finally {
      setLoading(false);
      setGenerationStep('');
      setGenerationProgress(0);
    }
  };

  const handleAnswer = (questionId: string, answer: string) => {
    if (!testCompleted) {
      setAnswers((prev) => ({ ...prev, [questionId]: answer }));
    }
  };

  const toggleMarkForReview = (questionId: string) => {
    setMarkedForReview((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const handleSubmit = () => {
    const calculatedScore = questions.reduce((acc, question) => {
      return acc + (answers[question.id] === question.correctAnswer ? 1 : 0);
    }, 0);
    setScore(calculatedScore);
    setTestCompleted(true);
    setTestStarted(false);
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

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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

  if (testCompleted) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-card rounded-lg shadow-lg border border-border p-6 mb-8">
          <h1 className="text-3xl font-bold text-card-foreground mb-4">Test Results</h1>
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xl text-muted-foreground">
                {exam.replace('_', ' ')} - {subject}
              </p>
              <p className="text-lg text-muted-foreground mt-2">
                Score: <span className="font-bold text-primary">{score}</span> out of {questions.length}
              </p>
            </div>
            <Button onClick={startTest}>Take Another Test</Button>
          </div>
        </div>

        <div className="space-y-8">
          {questions.map((question, index) => {
            const isCorrect = answers[question.id] === question.correctAnswer;
            const userAnswer = answers[question.id];

            return (
              <div
                key={question.id}
                className={`bg-card p-6 rounded-lg shadow-lg border ${
                  isCorrect ? 'border-green-500/20' : 'border-destructive/20'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-medium text-muted-foreground">Question {index + 1}</span>
                    {isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                  </div>
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
                            : option === userAnswer && option !== question.correctAnswer
                            ? 'border-destructive/20 bg-destructive/10'
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
                    <div className="flex gap-4 items-center">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-1">Your Answer:</p>
                        <div className={`p-3 rounded-lg border ${
                          isCorrect ? 'border-green-500/20 bg-green-500/10' : 'border-destructive/20 bg-destructive/10'
                        }`}>
                          {userAnswer || 'No answer provided'}
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-1">Correct Answer:</p>
                        <div className="p-3 rounded-lg border border-green-500/20 bg-green-500/10">
                          {question.correctAnswer}
                        </div>
                      </div>
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
            );
          })}
        </div>
      </div>
    );
  }

  if (!testStarted) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-bold text-card-foreground">Test Mode</h1>
          <p className="text-xl text-muted-foreground">
            {exam.replace('_', ' ')} - {subject}
            {specificTopic && ` - ${specificTopic}`}
          </p>

          <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-card-foreground mb-4">Instructions</h2>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Duration: 20 minutes
              </li>
              <li>Total Questions: 20</li>
              <li>Each question carries equal marks</li>
              <li>No negative marking</li>
              <li>You can mark questions for review and return to them later</li>
              <li>Test will be automatically submitted when the time is up</li>
            </ul>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {loading && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <Brain className="w-6 h-6 text-primary animate-pulse" />
                <p className="text-primary font-medium">{generationStep}</p>
              </div>
              <div className="w-full max-w-md mx-auto bg-accent/50 rounded-full h-2.5">
                <div 
                  className="bg-primary rounded-full h-2.5 transition-all duration-500"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                We are analyzing past years data to generate probable questions that can be asked in next exam
              </p>
            </div>
          )}

          <div className="flex justify-center gap-4">
            <Button onClick={() => navigate('/')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button 
              onClick={startTest} 
              disabled={loading}
              className="min-w-[200px]"
            >
              {loading ? 'Generating Questions...' : 'Start Test'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="sticky top-0 bg-background z-10 p-4 border-b border-border mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-card-foreground">
            {exam.replace('_', ' ')} - {subject}
            {specificTopic && ` - ${specificTopic}`}
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-lg font-medium">
              Time Left: <span className="text-primary">{formatTime(timeLeft)}</span>
            </div>
            <Button onClick={handleSubmit}>Submit Test</Button>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {questions.map((question, index) => (
          <div
            key={question.id}
            className={`bg-card p-6 rounded-lg shadow-lg border ${
              markedForReview.has(question.id) ? 'border-yellow-500/50' : 'border-border'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-lg font-medium text-muted-foreground">Question {index + 1}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleMarkForReview(question.id)}
                className={markedForReview.has(question.id) ? 'text-yellow-500' : ''}
              >
                {markedForReview.has(question.id) ? 'Marked for Review' : 'Mark for Review'}
              </Button>
            </div>

            <p className="text-lg text-card-foreground mb-6">{question.text}</p>

            {question.type === 'MCQ' && question.options && (
              <div className="space-y-3">
                {question.options.map((option, optionIndex) => (
                  <div
                    key={optionIndex}
                    className="flex items-center p-4 rounded-lg border border-border hover:bg-accent cursor-pointer"
                    onClick={() => handleAnswer(question.id, option)}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={option}
                      checked={answers[question.id] === option}
                      onChange={() => handleAnswer(question.id, option)}
                      className="h-4 w-4 text-primary focus:ring-primary"
                    />
                    <label className="ml-3 text-card-foreground cursor-pointer">{option}</label>
                  </div>
                ))}
              </div>
            )}

            {question.type === 'NUMERICAL' && (
              <div>
                <input
                  type="number"
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswer(question.id, e.target.value)}
                  className="w-full p-3 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring text-foreground"
                  placeholder="Enter your answer"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}