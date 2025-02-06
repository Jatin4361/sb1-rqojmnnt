import { Question } from '../types';
import { supabase } from '@/lib/supabase';

export async function generateQuestions(
  exam: string,
  subject: string,
  questionType: string,
  questionPattern: string,
  mode: 'practice' | 'test' = 'practice',
  specificTopic?: string
): Promise<{ questions: Question[] }> {
  try {
    // Validate input parameters
    if (!exam || !subject) {
      throw new Error('Exam and subject are required');
    }

    // Log input parameters for debugging
    console.log('Query parameters:', {
      exam_type: exam,
      subject: subject,
      question_type: questionType,
      question_pattern: questionPattern,
      mode: mode,
      specific_topic: specificTopic
    });

    // First, check if there are any questions for this exam and subject
    const { data: subjectCheck, error: subjectError } = await supabase
      .from('master_questions')
      .select('id')
      .eq('exam_type', exam)
      .eq('subject', subject)
      .limit(1);

    if (subjectError) {
      console.error('Subject check error:', subjectError);
      throw new Error('Database error while checking subject');
    }

    if (!subjectCheck || subjectCheck.length === 0) {
      throw new Error(`No questions found for ${exam} - ${subject}`);
    }

    // Build the main query
    let query = supabase
      .from('master_questions')
      .select('*')
      .eq('exam_type', exam)
      .eq('subject', subject);

    // Add filters only if we have basic questions available
    if (mode === 'test') {
      query = query.in('difficulty', ['MEDIUM', 'HARD']);
    }

    if (questionType && questionType !== 'all') {
      query = query.eq('question_type', questionType);
    }

    if (questionPattern && questionPattern !== 'all') {
      query = query.eq('question_pattern', questionPattern);
    }

    if (specificTopic && specificTopic.trim()) {
      query = query.ilike('topic', `%${specificTopic.trim()}%`);
    }

    // Execute query
    const { data: questions, error: fetchError } = await query;

    if (fetchError) {
      console.error('Query error:', fetchError);
      throw new Error('Failed to fetch questions from database');
    }

    // Log the results
    console.log(`Found ${questions?.length || 0} questions matching criteria`);

    if (!questions || questions.length === 0) {
      // Try a more relaxed query without additional filters
      const { data: relaxedQuestions, error: relaxedError } = await supabase
        .from('master_questions')
        .select('*')
        .eq('exam_type', exam)
        .eq('subject', subject);

      if (relaxedError || !relaxedQuestions || relaxedQuestions.length === 0) {
        throw new Error(
          'No questions available for the selected criteria. Try removing some filters.'
        );
      }

      console.log('Using relaxed query results:', relaxedQuestions.length);
      questions = relaxedQuestions;
    }

    // Ensure we have enough questions
    if (questions.length < 5) {
      throw new Error(
        'Insufficient questions available. Please try different criteria.'
      );
    }

    // Shuffle and limit questions
    const shuffledQuestions = [...questions]
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(20, questions.length));

    // Transform to Question interface
    const transformedQuestions = shuffledQuestions.map((q, index) => ({
      id: q.id || `gen_${index}`,
      text: q.question_text,
      type: q.question_type,
      pattern: q.question_pattern,
      difficulty: q.difficulty,
      options: Array.isArray(q.options) ? q.options : [],
      correctAnswer: q.correct_answer,
      explanation: q.explanation || 'Explanation not available'
    }));

    console.log(`Returning ${transformedQuestions.length} questions`);

    return { questions: transformedQuestions };
  } catch (error: any) {
    console.error('Error in generateQuestions:', {
      message: error.message,
      details: JSON.stringify(error, Object.getOwnPropertyNames(error))
    });
    throw error;
  }
}