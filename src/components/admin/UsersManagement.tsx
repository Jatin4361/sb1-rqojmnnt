import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '../ui/button';
import { Crown, XCircle } from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name: string;
  account_type: string;
  tokens: number;
  created_at: string;
}

const UsersManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      // First get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Then get emails for each profile using the get_user_email function
      const usersWithEmails = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: email } = await supabase
            .rpc('get_user_email', { user_id: profile.id });

          return {
            id: profile.id,
            email: email || 'N/A',
            full_name: profile.full_name || '',
            account_type: profile.account_type,
            tokens: profile.tokens,
            created_at: profile.created_at
          };
        })
      );

      setUsers(usersWithEmails);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePremium = async (userId: string, currentType: string) => {
    try {
      const newType = currentType === 'premium' ? 'free' : 'premium';
      const { error } = await supabase
        .from('profiles')
        .update({ account_type: newType })
        .eq('id', userId);

      if (error) throw error;
      
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, account_type: newType }
          : user
      ));
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const addTokens = async (userId: string, amount: number) => {
    try {
      // Get current tokens first
      const { data: profile, error: getError } = await supabase
        .from('profiles')
        .select('tokens')
        .eq('id', userId)
        .single();

      if (getError) throw getError;

      // Calculate new token amount
      const newTokens = (profile?.tokens || 0) + amount;

      // Update tokens
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ tokens: newTokens })
        .eq('id', userId);

      if (updateError) throw updateError;
      
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, tokens: newTokens }
          : user
      ));
    } catch (error) {
      console.error('Error adding tokens:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 bg-accent rounded"></div>
          <div className="h-8 w-64 bg-accent rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-card-foreground mb-8">Users Management</h1>
      
      <div className="bg-card rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-accent/50 border-b border-border">
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Account Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Tokens
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-card-foreground">
                        {user.full_name || 'No Name'}
                      </div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.account_type === 'premium'
                        ? 'bg-yellow-500/20 text-yellow-500'
                        : 'bg-accent text-muted-foreground'
                    }`}>
                      {user.account_type === 'premium' ? (
                        <Crown className="w-3 h-3 mr-1" />
                      ) : null}
                      {user.account_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {user.tokens}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addTokens(user.id, 5)}
                      >
                        Add 5 Tokens
                      </Button>
                      <Button
                        variant={user.account_type === 'premium' ? 'destructive' : 'default'}
                        size="sm"
                        onClick={() => togglePremium(user.id, user.account_type)}
                      >
                        {user.account_type === 'premium' ? (
                          <>
                            <XCircle className="w-4 h-4 mr-1" />
                            Remove Premium
                          </>
                        ) : (
                          <>
                            <Crown className="w-4 h-4 mr-1" />
                            Make Premium
                          </>
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UsersManagement;