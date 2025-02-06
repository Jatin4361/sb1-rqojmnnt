import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '../ui/button';
import { Trash2, Eye, Upload, Plus, BarChart3 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import BulkQuestionUpload from './BulkQuestionUpload';
import { Label } from '../ui/label';
import { Card } from '../ui/card';

interface Question {
  id: string;
  exam_type: string;
  subject: string;
  topic: string;
  question_text: string;
  question_type: string;
  difficulty: string;
  usage_count: number;
  created_at: string;
}

interface QuestionStats {
  exam_type: string;
  subject: string;
  count: number;
}

const QuestionsManagement = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [manualInputDialogOpen, setManualInputDialogOpen] = useState(false);
  const [manualJsonInput, setManualJsonInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    exam_type: '',
    subject: '',
    difficulty: ''
  });
  const [questionStats, setQuestionStats] = useState<QuestionStats[]>([]);
  const [showStats, setShowStats] = useState(false);

  const pageSize = 20;

  useEffect(() => {
    loadQuestions();
    loadQuestionStats();
  }, [currentPage, searchTerm, filter]);

  const loadQuestionStats = async () => {
    try {
      const { data, error } = await supabase
        .from('master_questions')
        .select('exam_type, subject')
        .then(result => {
          if (result.error) throw result.error;
          
          // Group questions by exam_type and subject
          const stats = result.data.reduce((acc: QuestionStats[], curr) => {
            const key = `${curr.exam_type}-${curr.subject}`;
            const existing = acc.find(s => 
              s.exam_type === curr.exam_type && s.subject === curr.subject
            );
            
            if (existing) {
              existing.count++;
            } else {
              acc.push({
                exam_type: curr.exam_type,
                subject: curr.subject,
                count: 1
              });
            }
            
            return acc;
          }, []);
          
          return { data: stats, error: null };
        });

      if (error) throw error;
      setQuestionStats(data || []);
    } catch (error) {
      console.error('Error loading question stats:', error);
    }
  };

  const loadQuestions = async () => {
    try {
      let query = supabase
        .from('master_questions')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filter.exam_type) {
        query = query.eq('exam_type', filter.exam_type);
      }
      if (filter.subject) {
        query = query.eq('subject', filter.subject);
      }
      if (filter.difficulty) {
        query = query.eq('difficulty', filter.difficulty);
      }

      // Apply search
      if (searchTerm) {
        query = query.or(`question_text.ilike.%${searchTerm}%,subject.ilike.%${searchTerm}%`);
      }

      // Apply pagination
      const start = (currentPage - 1) * pageSize;
      const end = start + pageSize - 1;

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(start, end);

      if (error) throw error;

      setQuestions(data || []);
      setTotalPages(Math.ceil((count || 0) / pageSize));
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      const { error } = await supabase
        .from('master_questions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setQuestions(questions.filter(q => q.id !== id));
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };

  const viewQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setViewDialogOpen(true);
  };

  const handleManualJsonSubmit = async () => {
    try {
      const jsonData = JSON.parse(manualJsonInput);
      
      // Transform questions to match database schema
      const transformedQuestions = jsonData.questions.map((q: any) => ({
        exam_type: jsonData.exam_name,
        subject: jsonData.subject,
        question_text: q.question,
        question_type: 'MCQ',
        question_pattern: jsonData.question_pattern === 'Numerical' ? 'NUMERICAL' : 'THEORETICAL',
        difficulty: 'MEDIUM',
        options: [
          `A) ${q.options.A}`,
          `B) ${q.options.B}`,
          `C) ${q.options.C}`,
          `D) ${q.options.D}`
        ],
        correct_answer: `${q.correct_answer}) ${q.options[q.correct_answer]}`,
        explanation: q.explanation,
        topic: q.subject
      }));

      // Insert questions in batches
      const batchSize = 50;
      for (let i = 0; i < transformedQuestions.length; i += batchSize) {
        const batch = transformedQuestions.slice(i, i + batchSize);
        const { error } = await supabase
          .from('master_questions')
          .insert(batch);

        if (error) throw error;
      }

      setManualInputDialogOpen(false);
      setManualJsonInput('');
      loadQuestions();
      setError(null);
    } catch (error: any) {
      setError(error.message || 'Failed to process JSON input');
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-accent rounded"></div>
          <div className="h-96 bg-accent rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-card-foreground">Questions Management</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowStats(!showStats)} variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            {showStats ? 'Hide Stats' : 'Show Stats'}
          </Button>
          <Button onClick={() => setManualInputDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Questions
          </Button>
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Bulk Upload
          </Button>
        </div>
      </div>

      {showStats && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Question Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {questionStats.map((stat, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border border-border bg-card"
              >
                <h3 className="font-medium text-card-foreground">
                  {stat.exam_type}
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {stat.subject}
                </p>
                <p className="text-2xl font-bold text-primary">
                  {stat.count} questions
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          type="text"
          placeholder="Search questions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring text-foreground"
        />
        
        <select
          value={filter.exam_type}
          onChange={(e) => setFilter({ ...filter, exam_type: e.target.value })}
          className="px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring text-foreground"
        >
          <option value="">All Exam Types</option>
          <option value="GATE">GATE</option>
          <option value="NEET">NEET</option>
          <option value="JEE_MAINS">JEE MAINS</option>
          <option value="CAT">CAT</option>
        </select>

        <select
          value={filter.difficulty}
          onChange={(e) => setFilter({ ...filter, difficulty: e.target.value })}
          className="px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring text-foreground"
        >
          <option value="">All Difficulties</option>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>

        <Button 
          variant="outline" 
          onClick={() => {
            setSearchTerm('');
            setFilter({ exam_type: '', subject: '', difficulty: '' });
          }}
        >
          Clear Filters
        </Button>
      </div>

      <div className="bg-card rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-accent/50 border-b border-border">
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Exam Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Topic
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Question Preview
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Difficulty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {questions.map((question) => (
                <tr key={question.id} className="hover:bg-accent/5">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">
                    {question.exam_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">
                    {question.subject}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">
                    {question.topic || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-card-foreground">
                    <div className="max-w-xs truncate">
                      {question.question_text}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">
                    {question.question_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      question.difficulty === 'EASY'
                        ? 'bg-green-500/20 text-green-500'
                        : question.difficulty === 'MEDIUM'
                        ? 'bg-yellow-500/20 text-yellow-500'
                        : 'bg-red-500/20 text-red-500'
                    }`}>
                      {question.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">
                    {question.usage_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewQuestion(question)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteQuestion(question.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* View Question Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Question Details</DialogTitle>
          </DialogHeader>
          {selectedQuestion && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Question Text</h3>
                <p className="mt-1 text-sm text-card-foreground">{selectedQuestion.question_text}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Exam Type</h3>
                  <p className="mt-1 text-sm text-card-foreground">{selectedQuestion.exam_type}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Subject</h3>
                  <p className="mt-1 text-sm text-card-foreground">{selectedQuestion.subject}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Question Type</h3>
                  <p className="mt-1 text-sm text-card-foreground">{selectedQuestion.question_type}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Difficulty</h3>
                  <p className="mt-1 text-sm text-card-foreground">{selectedQuestion.difficulty}</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Created At</h3>
                <p className="mt-1 text-sm text-card-foreground">
                  {new Date(selectedQuestion.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Bulk Upload Questions</DialogTitle>
          </DialogHeader>
          <BulkQuestionUpload 
            onSuccess={() => {
              setUploadDialogOpen(false);
              loadQuestions();
            }} 
          />
        </DialogContent>
      </Dialog>

      {/* Manual JSON Input Dialog */}
      <Dialog open={manualInputDialogOpen} onOpenChange={setManualInputDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Add Questions Manually</DialogTitle>
          </DialogHeader>
          
          {error && (
            <div className="p-4 mb-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="json-input">Paste JSON Data</Label>
              <textarea
                id="json-input"
                value={manualJsonInput}
                onChange={(e) => setManualJsonInput(e.target.value)}
                className="w-full h-[400px] px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring text-foreground font-mono text-sm"
                placeholder="Paste your JSON data here..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setManualInputDialogOpen(false);
                  setManualJsonInput('');
                  setError(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleManualJsonSubmit}>
                Add Questions
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuestionsManagement;