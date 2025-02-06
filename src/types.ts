import { ExamType } from './types';

export type QuestionType = 'MCQ' | 'NUMERICAL';
export type QuestionPattern = 'THEORETICAL' | 'NUMERICAL';
export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';

export interface Subject {
  id: string;
  name: string;
  examType: ExamType;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  pattern: QuestionPattern;
  difficulty: DifficultyLevel;
  options?: string[];
  correctAnswer: string | number;
  explanation?: string;
}