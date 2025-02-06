import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { MessageSquareText } from 'lucide-react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  order: number;
}

export default function FAQ() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
      
      // Only set FAQs if we have data
      if (data && data.length > 0) {
        setFaqs(data);
      } else {
        console.log('No FAQs found');
      }
    } catch (error: any) {
      console.error('Error loading FAQs:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="h-8 w-64 bg-accent/50 rounded mx-auto mb-4"></div>
            <div className="h-4 w-48 bg-accent/50 rounded mx-auto"></div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-card rounded-lg p-6 animate-pulse"
              >
                <div className="h-6 w-3/4 bg-accent/50 rounded mb-4"></div>
                <div className="h-4 w-full bg-accent/50 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-destructive">Failed to load FAQs. Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  // Don't render anything if no FAQs
  if (!faqs.length) {
    return null;
  }

  return (
    <section className="py-16 bg-background/50 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-2 bg-accent rounded-full text-accent-foreground mb-4">
            <MessageSquareText className="h-4 w-4 md:h-5 md:w-5 mr-2" />
            <span className="text-sm font-medium">Got Questions?</span>
          </div>
          <h2 className="text-3xl font-bold gradient-border mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground">
            Everything you need to know about Exam Predict
          </p>
        </div>

        <div className="grid gap-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={faq.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group"
            >
              <motion.div
                className={`bg-card hover:bg-accent/50 rounded-lg p-6 cursor-pointer transition-all border border-border ${
                  expandedId === faq.id ? 'bg-accent/50' : ''
                }`}
                onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <h3 className="text-lg font-semibold text-card-foreground group-hover:text-primary flex justify-between items-center">
                  {faq.question}
                  <motion.span
                    animate={{ rotate: expandedId === faq.id ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    ⌄
                  </motion.span>
                </h3>
                <motion.div
                  initial={false}
                  animate={{ height: expandedId === faq.id ? 'auto' : 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <p className="text-muted-foreground mt-4">
                    {faq.answer}
                  </p>
                </motion.div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}