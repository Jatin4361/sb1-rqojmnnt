import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function generateQuestionsWithOpenAI(
  exam: string,
  subject: string,
  questionType: string,
  questionPattern: string,
  mode: 'practice' | 'test' = 'practice',
  count: number
): Promise<any> {
  try {
    let subjectSpecificPrompt = '';
    if (exam === 'GATE') {
      switch (subject) {
        case 'computer-science':
          subjectSpecificPrompt = `
            Focus on core computer science topics:
            - Data structures and algorithms (trees, graphs, dynamic programming)
            - Operating systems (process management, memory management, file systems)
            - Database management systems (normalization, transactions, SQL)
            - Computer networks (TCP/IP, routing, network security)
            - Theory of computation (automata, complexity theory)
          `;
          break;
        // Add other subjects as needed
      }
    }

    const format = `The response must be a JSON object with this exact structure:
    {
      "questions": [
        {
          "text": "Clear question text",
          "type": "${questionType}",
          "pattern": "${questionPattern}",
          ${questionType === 'MCQ' ? 
            '"options": ["A) First option", "B) Second option", "C) Third option", "D) Fourth option"],' : 
            ''
          }
          "correctAnswer": ${questionType === 'MCQ' ? 
            '"A) First option" // Must match one of the options exactly' : 
            '"numerical_value"'
          },
          "explanation": "Clear step-by-step solution",
          "difficulty": ${mode === 'test' ? 
            '"MEDIUM" or "HARD"' : 
            '"EASY", "MEDIUM", or "HARD"'
          }
        }
      ]
    }`;

    const systemPrompt = `You are an expert exam question generator for ${exam} exams.
    Generate exactly ${count} questions that are accurate, clear, and at the appropriate difficulty level.
    Follow the required JSON format exactly - no deviations are allowed.
    ${format}`;

    const userPrompt = `Generate ${count} ${mode === 'test' ? 'challenging (MEDIUM or HARD difficulty)' : ''} ${questionType} questions for ${exam} exam, subject: ${subject}.

    Critical Requirements:
    1. Questions must be ${questionPattern} in nature
    2. ${mode === 'test' ? 'ONLY use MEDIUM or HARD difficulty levels' : 'Use appropriate difficulty levels (EASY, MEDIUM, HARD)'}
    3. Explanations must include step-by-step solutions
    4. For MCQ questions:
       - Options must start with A), B), C), D)
       - The correct answer must match one of the options exactly
       - All options must be unique
    5. For numerical questions:
       - Provide the exact numerical answer
       - Include units if applicable
    6. Questions must be at ${exam} exam level
    7. Include calculations and practical applications
    8. Each question must be complete and self-contained

    ${subjectSpecificPrompt}

    Remember: Return ONLY the JSON object with the questions array. No additional text or explanations outside the JSON structure.`;

    const completion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: 'gpt-3.5-turbo-1106',
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 4000,
      top_p: 1,
      frequency_penalty: 0.3,
      presence_penalty: 0.3
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response received from OpenAI');
    }

    try {
      const parsedResponse = JSON.parse(response);
      
      // Validate response structure
      if (!parsedResponse || typeof parsedResponse !== 'object') {
        throw new Error('Invalid response: not an object');
      }
      
      if (!Array.isArray(parsedResponse.questions)) {
        throw new Error('Invalid response: questions property must be an array');
      }

      if (parsedResponse.questions.length !== count) {
        throw new Error(`Invalid response: expected ${count} questions, got ${parsedResponse.questions.length}`);
      }

      // Validate each question
      parsedResponse.questions = parsedResponse.questions.map((q: any, index: number) => {
        // Normalize the question object
        const normalizedQuestion = {
          text: q.text?.trim(),
          type: q.type?.toUpperCase(),
          pattern: q.pattern?.toUpperCase(),
          options: q.type?.toUpperCase() === 'MCQ' ? q.options?.map((o: string) => o.trim()) : undefined,
          correctAnswer: q.correctAnswer?.trim(),
          explanation: q.explanation?.trim() || 'No explanation provided',
          difficulty: q.difficulty?.toUpperCase()
        };

        // Validate required fields
        const requiredFields = ['text', 'type', 'pattern', 'correctAnswer', 'difficulty', 'explanation'];
        const missingFields = requiredFields.filter(field => !normalizedQuestion[field]);
        
        if (missingFields.length > 0) {
          throw new Error(`Question ${index + 1} is missing required fields: ${missingFields.join(', ')}`);
        }

        // Validate MCQ specific requirements
        if (normalizedQuestion.type === 'MCQ') {
          if (!Array.isArray(normalizedQuestion.options) || normalizedQuestion.options.length !== 4) {
            throw new Error(`Question ${index + 1} must have exactly 4 options`);
          }

          // Validate option format
          normalizedQuestion.options.forEach((option: string, optIndex: number) => {
            if (!option.startsWith(`${String.fromCharCode(65 + optIndex)}) `)) {
              throw new Error(`Question ${index + 1}, option ${optIndex + 1} must start with "${String.fromCharCode(65 + optIndex)}) "`);
            }
          });

          // Validate correct answer matches an option
          if (!normalizedQuestion.options.includes(normalizedQuestion.correctAnswer)) {
            throw new Error(`Question ${index + 1} has correct answer that doesn't match any option`);
          }
        }

        // Validate difficulty level
        const validDifficulties = mode === 'test' ? ['MEDIUM', 'HARD'] : ['EASY', 'MEDIUM', 'HARD'];
        if (!validDifficulties.includes(normalizedQuestion.difficulty)) {
          throw new Error(`Question ${index + 1} has invalid difficulty level: ${normalizedQuestion.difficulty}`);
        }

        return normalizedQuestion;
      });

      return parsedResponse;
    } catch (error: any) {
      console.error('Failed to parse or validate OpenAI response:', error);
      throw new Error(`Invalid response format: ${error.message}`);
    }
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    throw new Error(error.message || 'Failed to generate questions with OpenAI');
  }
}