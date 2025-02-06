import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Razorpay from "npm:razorpay@2.9.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'true'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      }
    });
  }

  try {
    const { amount, currency = 'INR', planId } = await req.json();

    if (!amount || !planId) {
      throw new Error('Amount and planId are required');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const razorpay = new Razorpay({
      key_id: Deno.env.get('RAZORPAY_KEY_ID') || 'rzp_test_54J5jGCiZLXatf',
      key_secret: Deno.env.get('RAZORPAY_KEY_SECRET') || '0sc8vCquUiQfJNzPtCX2mnDU'
    });

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || 'https://ovkcfuwhyymfremtotkr.supabase.co',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92a2NmdXdoeXltZnJlbXRvdGtyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjYxNjY5MiwiZXhwIjoyMDUyMTkyNjkyfQ.IZHXvv7tqZ4mt6w4X8NpVhTP4DmzvfK0dM1CSUdcjog'
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency,
      receipt: `receipt_${Date.now()}`,
      notes: {
        user_id: user.id,
        plan_id: planId
      }
    });

    if (!order || !order.id) {
      throw new Error('Failed to create Razorpay order');
    }

    const { error: insertError } = await supabaseClient
      .from('payment_history')
      .insert({
        user_id: user.id,
        order_id: order.id,
        amount: amount,
        plan_id: planId,
        status: 'pending'
      });

    if (insertError) {
      console.error('Error creating payment history:', insertError);
      throw new Error('Failed to create payment record');
    }

    return new Response(
      JSON.stringify(order),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        } 
      }
    );
  } catch (error) {
    console.error('Error in create-razorpay-order:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      { 
        status: error.message.includes('Unauthorized') ? 401 : 400, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        } 
      }
    );
  }
});