import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '../ui/card';
import { Users, BookOpen, Crown, Coins } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    premiumUsers: 0,
    totalQuestions: 0,
    activeUsers: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Get total users count from profiles table
      const { count: totalUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' });

      if (usersError) throw usersError;

      // Get premium users count
      const { count: premiumUsers, error: premiumError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .eq('account_type', 'premium');

      if (premiumError) throw premiumError;

      // Get total questions count
      const { count: totalQuestions, error: questionsError } = await supabase
        .from('master_questions')
        .select('*', { count: 'exact' });

      if (questionsError) throw questionsError;

      // Get active users (users who used the platform in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: activeUsers, error: activeError } = await supabase
        .from('saved_questions')
        .select('user_id', { count: 'exact', distinct: true })
        .gte('created_at', sevenDaysAgo.toISOString());

      if (activeError) throw activeError;

      setStats({
        totalUsers: totalUsers || 0,
        premiumUsers: premiumUsers || 0,
        totalQuestions: totalQuestions || 0,
        activeUsers: activeUsers || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const cards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'Premium Users',
      value: stats.premiumUsers,
      icon: Crown,
      color: 'bg-yellow-500',
    },
    {
      title: 'Total Questions',
      value: stats.totalQuestions,
      icon: BookOpen,
      color: 'bg-green-500',
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      icon: Coins,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-card-foreground mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <Card key={card.title} className="p-6 bg-card">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${card.color}/20 mr-4`}>
                <card.icon className={`w-6 h-6 ${card.color.replace('bg-', 'text-')}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                <p className="text-2xl font-semibold text-card-foreground">{card.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;