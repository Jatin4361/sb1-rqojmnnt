/*
  # Add sample questions

  1. New Data
    - Add sample GATE questions for Electronics and Communication
    - Include a mix of MCQ and numerical questions
    - Cover different difficulty levels
    - Add proper explanations and topics
*/

INSERT INTO master_questions (
  exam_type,
  subject,
  topic,
  question_text,
  question_type,
  question_pattern,
  difficulty,
  options,
  correct_answer,
  explanation
) VALUES
(
  'GATE',
  'electronics-communication',
  'Digital Electronics',
  'What is the output of a 2-input XOR gate when both inputs are HIGH?',
  'MCQ',
  'THEORETICAL',
  'MEDIUM',
  ARRAY[
    'A) HIGH',
    'B) LOW',
    'C) Undefined',
    'D) Depends on the implementation'
  ],
  'B) LOW',
  'XOR gate outputs LOW (0) when both inputs are the same (both 0 or both 1). When both inputs are HIGH (1), the output is LOW.'
),
(
  'GATE',
  'electronics-communication',
  'Digital Electronics',
  'How many flip-flops are required to build a 4-bit synchronous counter?',
  'MCQ',
  'THEORETICAL',
  'MEDIUM',
  ARRAY[
    'A) 2',
    'B) 3',
    'C) 4',
    'D) 8'
  ],
  'C) 4',
  'A 4-bit counter needs to count from 0000 to 1111 (0-15), requiring 4 flip-flops, one for each bit.'
),
(
  'GATE',
  'electronics-communication',
  'Analog Electronics',
  'Calculate the voltage gain of an inverting amplifier with Rf = 100kΩ and Ri = 10kΩ.',
  'NUMERICAL',
  'NUMERICAL',
  'MEDIUM',
  NULL,
  '-10',
  'For an inverting amplifier, voltage gain = -Rf/Ri = -(100k/10k) = -10. The negative sign indicates phase inversion.'
),
(
  'GATE',
  'electronics-communication',
  'Network Theory',
  'In an RLC series circuit at resonance, what is the phase relationship between voltage and current?',
  'MCQ',
  'THEORETICAL',
  'EASY',
  ARRAY[
    'A) Current leads voltage by 90°',
    'B) Voltage leads current by 90°',
    'C) Current and voltage are in phase',
    'D) Current and voltage are 180° out of phase'
  ],
  'C) Current and voltage are in phase',
  'At resonance in an RLC series circuit, the inductive and capacitive reactances cancel each other out, leaving only the resistance. This results in voltage and current being in phase.'
),
(
  'GATE',
  'electronics-communication',
  'Control Systems',
  'A unity feedback control system has open-loop transfer function G(s) = K/(s(s+2)). For what value of K will the damping ratio be 0.5?',
  'NUMERICAL',
  'NUMERICAL',
  'HARD',
  NULL,
  '8',
  'For a second-order system with characteristic equation s² + 2ζωₙs + ωₙ², comparing with s² + 2s + K = 0, we get 2ζωₙ = 2 and ωₙ² = K. For ζ = 0.5, K = 8.'
),
(
  'GATE',
  'electronics-communication',
  'Digital Signal Processing',
  'What is the length of linear convolution of two sequences of lengths 3 and 4?',
  'MCQ',
  'THEORETICAL',
  'MEDIUM',
  ARRAY[
    'A) 3',
    'B) 4',
    'C) 6',
    'D) 7'
  ],
  'C) 6',
  'The length of linear convolution is (L1 + L2 - 1), where L1 and L2 are lengths of the sequences. Here, 3 + 4 - 1 = 6.'
),
(
  'GATE',
  'electronics-communication',
  'Electromagnetic Theory',
  'Calculate the cutoff frequency (in GHz) of the dominant mode in a rectangular waveguide with dimensions a = 2 cm and b = 1 cm.',
  'NUMERICAL',
  'NUMERICAL',
  'HARD',
  NULL,
  '7.5',
  'For TE10 mode (dominant), fc = c/(2a) where c is speed of light. With a = 0.02m, fc = 3x10⁸/(2*0.02) = 7.5 GHz.'
);