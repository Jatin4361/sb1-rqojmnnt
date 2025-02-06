/*
  # Add initial FAQ data

  1. Insert initial FAQ entries
*/

-- Insert initial FAQs
INSERT INTO faqs (question, answer, "order") VALUES
('What is Exam Predict?', 'Exam Predict is an AI-powered exam preparation platform that uses advanced algorithms to predict probable questions for your upcoming exams. We analyze past exam patterns and current trends to help you prepare effectively.', 0),
('How accurate are the predictions?', 'Our prediction system maintains a 95% accuracy rate based on historical data and continuous learning. We regularly update our algorithms to improve accuracy and stay current with exam patterns.', 1),
('How does the token system work?', 'Free users get 5 tokens to start. Each practice or test session uses 1 token. Premium users get unlimited access without tokens. You can earn more tokens through regular practice or upgrade to premium for unlimited access.', 2),
('What exams do you support?', 'We currently support major competitive exams including NEET, JEE MAINS, GATE, and CAT. We''re continuously expanding our coverage to include more exams based on user demand.', 3),
('How do I get started?', 'Simply sign up for a free account, choose your target exam, and start practicing! You''ll get 5 free tokens to explore our platform. You can then choose to continue with the free plan or upgrade to premium for unlimited access.', 4);