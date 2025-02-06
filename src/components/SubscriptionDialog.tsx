import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Coins, Crown, Check } from 'lucide-react';
import { subscriptionPlans } from '@/services/payment';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function SubscriptionDialog({ isOpen, onClose }: Props) {
  const navigate = useNavigate();
  const plan = subscriptionPlans[0];

  const handleSubscribe = () => {
    onClose();
    navigate('/payment');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-card">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-card-foreground">
            Upgrade to Pro
          </DialogTitle>
        </DialogHeader>

        <Card className="p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2">
            <Crown className="h-6 w-6 text-yellow-500" />
          </div>

          <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
          <p className="text-muted-foreground mb-4">{plan.description}</p>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              <span className="font-medium">{plan.tokens} Tokens</span>
            </div>

            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Access to all exam types</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Detailed explanations</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Save unlimited questions</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Priority support</span>
              </li>
            </ul>

            <div className="mt-6">
              <div className="text-2xl font-bold mb-4">
                ₹{plan.price}
              </div>
              <Button 
                className="w-full"
                onClick={handleSubscribe}
              >
                Continue to Payment
              </Button>
            </div>
          </div>
        </Card>
      </DialogContent>
    </Dialog>
  );
}