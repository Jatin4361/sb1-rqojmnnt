import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Label } from '../ui/label';
import { Plus, Edit2, Trash2, Save } from 'lucide-react';
import { examSubjects } from '@/config/examConfig';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

interface ExamConfig {
  id: string;
  exam_type: string;
  subjects: Array<{
    id: string;
    name: string;
  }>;
  question_types: string[];
  question_patterns: string[];
}

const ExamManagement = () => {
  const [examConfigs, setExamConfigs] = useState<ExamConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ExamConfig | null>(null);
  const [formData, setFormData] = useState({
    exam_type: '',
    subjects: [] as { id: string; name: string }[],
    question_types: ['MCQ', 'NUMERICAL'],
    question_patterns: ['THEORETICAL', 'NUMERICAL']
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadExamConfigs();
  }, []);

  const loadExamConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('exam_configs')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setExamConfigs(data || []);
    } catch (error) {
      console.error('Error loading exam configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingConfig(null);
    setFormData({
      exam_type: '',
      subjects: [],
      question_types: ['MCQ', 'NUMERICAL'],
      question_patterns: ['THEORETICAL', 'NUMERICAL']
    });
    setError(null);
    setDialogOpen(true);
  };

  const handleEdit = (config: ExamConfig) => {
    setEditingConfig(config);
    setFormData({
      exam_type: config.exam_type,
      subjects: config.subjects,
      question_types: config.question_types,
      question_patterns: config.question_patterns
    });
    setError(null);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this exam configuration?')) return;

    try {
      const { error } = await supabase
        .from('exam_configs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setExamConfigs(examConfigs.filter(config => config.id !== id));
    } catch (error) {
      console.error('Error deleting exam config:', error);
      setError('Failed to delete exam configuration');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.exam_type || formData.subjects.length === 0) {
      setError('Exam type and at least one subject are required');
      return;
    }

    try {
      if (editingConfig) {
        const { error: updateError } = await supabase
          .from('exam_configs')
          .update({
            exam_type: formData.exam_type,
            subjects: formData.subjects,
            question_types: formData.question_types,
            question_patterns: formData.question_patterns,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingConfig.id);

        if (updateError) throw updateError;

        setExamConfigs(examConfigs.map(config =>
          config.id === editingConfig.id
            ? {
                ...config,
                exam_type: formData.exam_type,
                subjects: formData.subjects,
                question_types: formData.question_types,
                question_patterns: formData.question_patterns
              }
            : config
        ));
      } else {
        const { data, error: insertError } = await supabase
          .from('exam_configs')
          .insert({
            exam_type: formData.exam_type,
            subjects: formData.subjects,
            question_types: formData.question_types,
            question_patterns: formData.question_patterns
          })
          .select()
          .single();

        if (insertError) throw insertError;
        if (data) setExamConfigs([...examConfigs, data]);
      }

      setDialogOpen(false);
      setFormData({
        exam_type: '',
        subjects: [],
        question_types: ['MCQ', 'NUMERICAL'],
        question_patterns: ['THEORETICAL', 'NUMERICAL']
      });
      setEditingConfig(null);
    } catch (error: any) {
      console.error('Error saving exam config:', error);
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 bg-accent rounded"></div>
          <div className="h-8 w-64 bg-accent rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-card-foreground">Exam Management</h1>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add Exam
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6">
        {examConfigs.map((config) => (
          <Card key={config.id} className="p-6 bg-card">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-card-foreground mb-2">
                  {config.exam_type.replace('_', ' ')}
                </h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Subjects:</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {config.subjects.map((subject) => (
                        <span
                          key={subject.id}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                        >
                          {subject.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Question Types:</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {config.question_types.map((type) => (
                        <span
                          key={type}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent text-accent-foreground"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Question Patterns:</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {config.question_patterns.map((pattern) => (
                        <span
                          key={pattern}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent text-accent-foreground"
                        >
                          {pattern}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(config)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(config.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-card">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">
              {editingConfig ? 'Edit Exam Configuration' : 'Add New Exam Configuration'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="exam_type">Exam Type</Label>
              <select
                id="exam_type"
                value={formData.exam_type}
                onChange={(e) => setFormData({ ...formData, exam_type: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring text-foreground"
                required
              >
                <option value="">Select Exam Type</option>
                {Object.keys(examSubjects).map((exam) => (
                  <option key={exam} value={exam}>
                    {exam.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Subjects</Label>
              <div className="grid gap-2">
                {formData.exam_type && examSubjects[formData.exam_type].map((subject) => (
                  <label
                    key={subject.id}
                    className="flex items-center space-x-2"
                  >
                    <input
                      type="checkbox"
                      checked={formData.subjects.some(s => s.id === subject.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            subjects: [...formData.subjects, { id: subject.id, name: subject.name }]
                          });
                        } else {
                          setFormData({
                            ...formData,
                            subjects: formData.subjects.filter(s => s.id !== subject.id)
                          });
                        }
                      }}
                      className="h-4 w-4 text-primary focus:ring-primary border-input rounded"
                    />
                    <span className="text-sm text-card-foreground">{subject.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingConfig ? 'Save Changes' : 'Add Exam'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExamManagement;