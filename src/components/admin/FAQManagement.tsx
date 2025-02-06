import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Label } from '../ui/label';
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  order: number;
  created_at: string;
}

export default function FAQManagement() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFAQs();
  }, []);

  const loadFAQs = async () => {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('order', { ascending: true });

      if (error) throw error;
      setFaqs(data || []);
    } catch (error) {
      console.error('Error loading FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingFaq(null);
    setFormData({ question: '', answer: '' });
    setError(null);
    setDialogOpen(true);
  };

  const handleEdit = (faq: FAQ) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
    });
    setError(null);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;

    try {
      // First get the FAQ to be deleted
      const faqToDelete = faqs.find(f => f.id === id);
      if (!faqToDelete) throw new Error('FAQ not found');

      // Delete the FAQ
      const { error: deleteError } = await supabase
        .from('faqs')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      
      // Update the order of remaining FAQs
      const remainingFaqs = faqs
        .filter(faq => faq.id !== id)
        .map((faq, index) => ({
          ...faq,
          order: index
        }));

      // Update the orders in the database
      if (remainingFaqs.length > 0) {
        const { error: updateError } = await supabase
          .from('faqs')
          .upsert(
            remainingFaqs.map(({ id, order }) => ({
              id,
              order
            }))
          );

        if (updateError) throw updateError;
      }

      setFaqs(remainingFaqs);
    } catch (error: any) {
      console.error('Error deleting FAQ:', error);
      setError(error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate input
    if (!formData.question.trim() || !formData.answer.trim()) {
      setError('Question and answer are required');
      return;
    }
    
    try {
      if (editingFaq) {
        // Update existing FAQ
        const { error: updateError } = await supabase
          .from('faqs')
          .update({
            question: formData.question.trim(),
            answer: formData.answer.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingFaq.id);

        if (updateError) throw updateError;

        setFaqs(faqs.map(faq => 
          faq.id === editingFaq.id 
            ? { ...faq, question: formData.question.trim(), answer: formData.answer.trim() }
            : faq
        ));
      } else {
        // Add new FAQ
        const newOrder = faqs.length;
        const { data, error: insertError } = await supabase
          .from('faqs')
          .insert({
            question: formData.question.trim(),
            answer: formData.answer.trim(),
            order: newOrder,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        if (data) setFaqs([...faqs, data]);
      }

      setDialogOpen(false);
      setFormData({ question: '', answer: '' });
      setEditingFaq(null);
    } catch (error: any) {
      console.error('Error saving FAQ:', error);
      setError(error.message);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === faqs.length - 1)
    ) {
      return;
    }

    try {
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      const newFaqs = [...faqs];
      const temp = newFaqs[index];
      newFaqs[index] = { ...newFaqs[newIndex], order: index };
      newFaqs[newIndex] = { ...temp, order: newIndex };
      
      // Update orders in database
      const { error } = await supabase
        .from('faqs')
        .upsert([
          { id: newFaqs[index].id, order: index },
          { id: newFaqs[newIndex].id, order: newIndex }
        ]);

      if (error) throw error;
      
      // Sort FAQs by order before updating state
      setFaqs(newFaqs.sort((a, b) => a.order - b.order));
    } catch (error: any) {
      console.error('Error reordering FAQs:', error);
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
        <h1 className="text-2xl font-bold text-card-foreground">FAQ Management</h1>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add FAQ
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <Card key={faq.id} className="p-6 bg-card">
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <h3 className="text-lg font-semibold text-card-foreground">
                  {faq.question}
                </h3>
                <p className="text-muted-foreground">
                  {faq.answer}
                </p>
              </div>
              <div className="flex gap-2 ml-4">
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMove(index, 'up')}
                    disabled={index === 0}
                    className="px-2"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMove(index, 'down')}
                    disabled={index === faqs.length - 1}
                    className="px-2"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(faq)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(faq.id)}
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
              {editingFaq ? 'Edit FAQ' : 'Add New FAQ'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="question">Question</Label>
              <input
                id="question"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring text-foreground"
                placeholder="Enter the question"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="answer">Answer</Label>
              <textarea
                id="answer"
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring text-foreground min-h-[100px]"
                placeholder="Enter the answer"
                required
              />
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
                {editingFaq ? 'Save Changes' : 'Add FAQ'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}