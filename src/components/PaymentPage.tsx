import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Crown, Check, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PaymentPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Check if Razorpay script is already loaded
    if (window.Razorpay) {
      setScriptLoaded(true);
      return;
    }

    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onerror = () => {
      setError('Failed to load payment gateway. Please try again.');
    };
    script.onload = () => {
      setScriptLoaded(true);
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePaymentSuccess = async (paymentId: string) => {
    setProcessing(true);
    setError(null);

    try {
      // Create order first
      const { data: orderData, error: orderError } = await supabase.rpc('create_razorpay_order', {
        amount_input: 299,
        currency_input: 'INR',
        plan_id_input: 'pro',
        user_id_input: user?.id
      });

      if (orderError) throw orderError;

      // Process the payment
      const { data, error } = await supabase.rpc('verify_razorpay_payment', {
        payment_id_input: paymentId,
        order_id_input: orderData.id,
        signature_input: 'verified',
        plan_id_input: 'pro',
        user_id_input: user?.id
      });

      if (error) throw error;

      if (data.success) {
        navigate('/profile', { 
          state: { 
            paymentSuccess: true,
            newTokens: data.new_tokens 
          }
        });
      } else {
        throw new Error(data.error || 'Payment verification failed');
      }
    } catch (error: any) {
      console.error('Error processing payment:', error);
      setError(error.message || 'Failed to process payment');
    } finally {
      setProcessing(false);
    }
  };

  const handleSubscribe = () => {
    if (!user || !scriptLoaded) return;

    try {
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: 29900,
        currency: "INR",
        name: "Exam Predict",
        description: "Pro Plan Subscription",
        handler: function(response: any) {
          if (response.razorpay_payment_id) {
            handlePaymentSuccess(response.razorpay_payment_id);
          }
        },
        prefill: {
          email: user.email
        },
        theme: {
          color: "#3B82F6"
        },
        modal: {
          ondismiss: function() {
            setError('Payment cancelled. Please try again.');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error: any) {
      console.error('Error initializing payment:', error);
      setError('Failed to initialize payment. Please try again.');
    }
  };

  // Check for payment ID in URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const paymentId = searchParams.get('razorpay_payment_id');
    
    if (paymentId) {
      handlePaymentSuccess(paymentId);
    }
  }, [location.search]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to continue</h1>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </div>
    );
  }

  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-lg font-medium">Processing your payment...</p>
        </div>
      </div>
    );
  }

  if (!scriptLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-lg font-medium">Loading payment gateway...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-md mx-auto space-y-8">
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)}
          className="mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <Card className="p-6 relative">
          <div className="absolute top-0 right-0 p-2">
            <Crown className="h-6 w-6 text-yellow-500" />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">Pro Plan</h1>
            <p className="text-muted-foreground">
              Get unlimited access to all features
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <div className="mt-1 p-3 bg-accent/50 rounded-lg text-foreground">
                {user.email}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium">Plan Includes:</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>15 Tokens</span>
                </li>
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
            </div>

            <div>
              <div className="text-2xl font-bold mb-4">₹299</div>
              <Button 
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700"
                onClick={handleSubscribe}
                disabled={!scriptLoaded}
              >
                Subscribe Now
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}