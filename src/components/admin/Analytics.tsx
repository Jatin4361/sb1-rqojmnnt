import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '../ui/card';
import { 
  TrendingUp, 
  TrendingDown,
  Users,
  BookOpen,
  Crown,
  Clock
} from 'lucide-react';

const Analytics = () => {
  const [stats, setStats] = useState({
    userGrowth: 0,
    questionUsage: 0,
    conversionRate: 0,
    avgSessionTime: 15, // Default value in minutes
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      // Calculate user growth (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: recentUsers } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', thirtyDaysAgo.toISOString());

      const { data: allUsers } = await supabase
        .from('profiles')
        .select('id, account_type');

      const totalUsers = allUsers?.length || 0;
      const newUsers = recentUsers?.length || 0;
      const userGrowth = totalUsers ? (newUsers / totalUsers) * 100 : 0;

      // Calculate question usage (average per user)
      const { data: questionUsageData } = await supabase
        .from('saved_questions')
        .select('user_id');

      const totalQuestions = questionUsageData?.length || 0;
      const questionUsage = totalUsers ? totalQuestions / totalUsers : 0;

      // Calculate premium conversion rate
      const premiumUsers = allUsers?.filter(user => user.account_type === 'premium').length || 0;
      const conversionRate = totalUsers ? (premiumUsers / totalUsers) * 100 : 0;

      // Get average session time from user_sessions
      const { data: sessionData } = await supabase
        .from('user_sessions')
        .select('duration')
        .gt('duration', 0);

      const avgSessionTime = sessionData?.length 
        ? Math.round(sessionData.reduce((acc, session) => acc + session.duration, 0) / sessionData.length)
        : 15; // Default to 15 minutes if no data

      setStats({
        userGrowth,
        questionUsage,
        conversionRate,
        avgSessionTime,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const metrics = [
    {
      title: 'User Growth',
      value: `${stats.userGrowth.toFixed(1)}%`,
      description: 'Last 30 days',
      icon: TrendingUp,
      trend: 'up',
    },
    {
      title: 'Questions per User',
      value: stats.questionUsage.toFixed(1),
      description: 'Average',
      icon: BookOpen,
      trend: 'up',
    },
    {
      title: 'Premium Conversion',
      value: `${stats.conversionRate.toFixed(1)}%`,
      description: 'Of total users',
      icon: Crown,
      trend: stats.conversionRate > 5 ? 'up' : 'down',
    },
    {
      title: 'Avg. Session Time',
      value: `${stats.avgSessionTime} min`,
      description: 'Per user',
      icon: Clock,
      trend: 'up',
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-card-foreground mb-8">Analytics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.title} className="p-6 bg-card">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${
                metric.trend === 'up' ? 'bg-green-500/20' : 'bg-red-500/20'
              }`}>
                <metric.icon className={`w-6 h-6 ${
                  metric.trend === 'up' ? 'text-green-500' : 'text-red-500'
                }`} />
              </div>
              {metric.trend === 'up' ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
            </div>
            <h3 className="text-sm font-medium text-muted-foreground">{metric.title}</h3>
            <p className="text-2xl font-semibold text-card-foreground mt-1">{metric.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{metric.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Analytics;