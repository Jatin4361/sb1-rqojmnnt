import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Coins } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const Settings = () => {
  const [userEmail, setUserEmail] = useState('');
  const [tokenAmount, setTokenAmount] = useState<number>(5);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleAddTokens = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Use the new RPC function to update tokens
      const { data, error } = await supabase
        .rpc('update_user_tokens', {
          email_input: userEmail,
          new_token_amount: tokenAmount
        });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error);
      }

      setMessage({
        type: 'success',
        text: `Successfully set ${tokenAmount} tokens for ${userEmail}`
      });
      setUserEmail('');
      setTokenAmount(5);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to add tokens'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTokenAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 0) {
      setTokenAmount(value);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-card-foreground mb-8">Settings</h1>
      
      <div className="grid gap-6">
        <Card className="p-6 bg-card">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Coins className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-card-foreground">Token Management</h2>
              <p className="text-sm text-muted-foreground">Add tokens to user accounts</p>
            </div>
          </div>

          {message && (
            <div className={`p-4 mb-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-500/10 border border-green-500/20 text-green-500'
                : 'bg-destructive/10 border border-destructive/20 text-destructive'
            }`}>
              {message.text}
            </div>
          )}
          
          <form onSubmit={handleAddTokens} className="space-y-4">
            <div>
              <Label htmlFor="user-email">User Email</Label>
              <input
                id="user-email"
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="mt-1 block w-full rounded-md bg-background border border-input px-3 py-2 text-foreground focus:ring-2 focus:ring-ring"
                placeholder="user@example.com"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="token-amount">Number of Tokens</Label>
              <input
                id="token-amount"
                type="number"
                value={tokenAmount}
                onChange={handleTokenAmountChange}
                min="0"
                className="mt-1 block w-full rounded-md bg-background border border-input px-3 py-2 text-foreground focus:ring-2 focus:ring-ring"
                required
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Adding Tokens...' : 'Add Tokens'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Settings;