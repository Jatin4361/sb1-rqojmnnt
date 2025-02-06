import { supabase } from '@/lib/supabase';

interface PaymentDetails {
  orderId: string;
  amount: number;
  currency: string;
  receipt: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  tokens: number;
}

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'pro',
    name: 'Pro Plan',
    description: 'Get 15 tokens and premium features',
    price: 299,
    tokens: 15
  }
];

export async function createPaymentOrder(planId: string): Promise<PaymentDetails> {
  try {
    const plan = subscriptionPlans.find(p => p.id === planId);
    if (!plan) {
      throw new Error('Invalid plan selected');
    }

    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      throw new Error('Authentication required');
    }

    // Call the SQL function to create order
    const { data, error } = await supabase.rpc('create_razorpay_order', {
      amount_input: plan.price,
      currency_input: 'INR',
      plan_id_input: planId,
      user_id_input: session.user.id
    });

    if (error) {
      console.error('Order creation error:', error);
      throw new Error(error.message || 'Failed to create payment order');
    }

    if (!data || !data.id) {
      throw new Error('Invalid response from payment service');
    }

    return {
      orderId: data.id,
      amount: plan.price,
      currency: 'INR',
      receipt: data.receipt
    };
  } catch (error: any) {
    console.error('Error creating payment order:', error);
    throw error;
  }
}

export async function verifyPayment(
  orderId: string,
  paymentId: string,
  signature: string,
  planId: string
): Promise<{ success: boolean; newTokens?: number; error?: string }> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      throw new Error('Authentication required');
    }

    const { data, error } = await supabase.rpc('verify_razorpay_payment', {
      payment_id_input: paymentId,
      order_id_input: orderId,
      signature_input: signature,
      plan_id_input: planId,
      user_id_input: session.user.id
    });

    if (error) {
      console.error('Payment verification error:', error);
      throw new Error(error.message || 'Payment verification failed');
    }

    if (!data.success) {
      throw new Error(data.error || 'Payment verification failed');
    }

    return {
      success: true,
      newTokens: data.new_tokens
    };
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return {
      success: false,
      error: error.message || 'Payment verification failed'
    };
  }
}