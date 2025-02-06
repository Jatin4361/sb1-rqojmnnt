import React from 'react';
import { GraduationCap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-background border-t border-border py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="ml-2 text-lg font-bold text-foreground">Exam Predict</span>
            </div>
            <p className="text-sm text-muted-foreground">
              AI-powered exam preparation platform helping students achieve their goals.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-foreground mb-4">Exams</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>NEET</li>
              <li>JEE MAINS</li>
              <li>GATE</li>
              <li>CAT</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-foreground mb-4">Resources</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Practice Questions</li>
              <li>Test Series</li>
              <li>Study Material</li>
              <li>Blog</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-foreground mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>support@exampred.com</li>
              <li>+91 123 456 7890</li>
              <li>FAQ</li>
              <li>Help Center</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-border">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Exam Predict. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}