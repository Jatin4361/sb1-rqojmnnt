import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Upload, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface BulkUploadProps {
  onSuccess: () => void;
}

export default function BulkQuestionUpload({ onSuccess }: BulkUploadProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<string[]>([]);

  const checkDuplicates = async (questions: any[]) => {
    const duplicateQuestions: string[] = [];
    
    for (const q of questions) {
      const { data, error } = await supabase
        .from('master_questions')
        .select('question_text')
        .eq('question_text', q.question)
        .limit(1);

      if (error) throw error;
      
      if (data && data.length > 0) {
        duplicateQuestions.push(`Question ${q.question_number}: ${q.question}`);
      }
    }
    
    return duplicateQuestions;
  };

  const validateAndTransformQuestions = (data: any) => {
    if (!data.exam_name || !data.subject || !data.questions || !Array.isArray(data.questions)) {
      throw new Error('Invalid JSON format. Required fields: exam_name, subject, and questions array');
    }

    return data.questions.map((q: any, index: number) => {
      try {
        // Validate common required fields
        if (!q.question) {
          throw new Error(`Question text is required for question ${index + 1}`);
        }
        if (!q.correct_answer) {
          throw new Error(`Correct answer is required for question ${index + 1}`);
        }

        // Determine if question is MCQ by checking for options property
        const isMCQ = q.options && typeof q.options === 'object' &&
                     Object.keys(q.options).length === 4;

        // Base question object
        const baseQuestion = {
          exam_type: data.exam_name,
          subject: q.subject || data.subject,
          question_text: q.question,
          question_type: isMCQ ? 'MCQ' : 'NUMERICAL',
          question_pattern: q.type === 'Theoretical' ? 'THEORETICAL' : 'NUMERICAL',
          difficulty: 'MEDIUM',
          explanation: q.explanation || '',
          topic: q.subject || data.subject
        };

        if (isMCQ) {
          // Validate MCQ specific fields
          const requiredOptions = ['A', 'B', 'C', 'D'];
          const missingOptions = requiredOptions.filter(opt => !q.options[opt]);
          
          if (missingOptions.length > 0) {
            throw new Error(`Missing options ${missingOptions.join(', ')} for MCQ question ${index + 1}`);
          }

          if (!requiredOptions.includes(q.correct_answer)) {
            throw new Error(`Invalid correct answer '${q.correct_answer}' for MCQ question ${index + 1}. Must be one of: A, B, C, D`);
          }

          return {
            ...baseQuestion,
            options: requiredOptions.map(opt => `${opt}) ${q.options[opt]}`),
            correct_answer: `${q.correct_answer}) ${q.options[q.correct_answer]}`
          };
        } else {
          // For numerical questions
          return {
            ...baseQuestion,
            options: null,
            correct_answer: q.correct_answer.toString()
          };
        }
      } catch (error: any) {
        throw new Error(`Error processing question ${index + 1}: ${error.message}`);
      }
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setDuplicates([]);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          let data;
          
          try {
            data = JSON.parse(content);
          } catch (parseError: any) {
            throw new Error(`Invalid JSON format: ${parseError.message}. Please check for extra commas, missing brackets, or other syntax errors.`);
          }

          // Check for duplicates first
          const duplicateQuestions = await checkDuplicates(data.questions);
          
          if (duplicateQuestions.length > 0) {
            setDuplicates(duplicateQuestions);
            throw new Error('Duplicate questions found');
          }

          // Transform questions
          const transformedQuestions = validateAndTransformQuestions(data);

          // Insert questions in batches of 50
          const batchSize = 50;
          for (let i = 0; i < transformedQuestions.length; i += batchSize) {
            const batch = transformedQuestions.slice(i, i + batchSize);
            const { error: insertError } = await supabase
              .from('master_questions')
              .insert(batch);

            if (insertError) {
              console.error('Insert error:', insertError);
              throw new Error(`Failed to insert questions: ${insertError.message}`);
            }
          }

          onSuccess();
        } catch (error: any) {
          console.error('Error processing file:', error);
          setError(error.message || 'Failed to process file');
        }
      };

      reader.readAsText(file);
    } catch (error: any) {
      console.error('Error uploading questions:', error);
      setError(error.message || 'Failed to upload questions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <p>{error}</p>
        </div>
      )}

      {duplicates.length > 0 && (
        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-500">
          <h3 className="font-medium mb-2">The following questions already exist:</h3>
          <ul className="list-disc list-inside space-y-1">
            {duplicates.map((q, i) => (
              <li key={i} className="text-sm">{q}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          className="relative"
          disabled={loading}
        >
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Upload className="h-4 w-4 mr-2" />
          {loading ? 'Uploading...' : 'Upload JSON'}
        </Button>
        <p className="text-sm text-muted-foreground">
          Upload a JSON file containing questions
        </p>
      </div>
    </div>
  );
}