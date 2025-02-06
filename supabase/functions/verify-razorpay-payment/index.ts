import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/crypto/mod.ts";

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
    const { orderId, paymentId, signature, planId } = await req.json();

    if (!orderId || !paymentId || !signature || !planId) {
      throw new Error('Missing required parameters');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const text = orderId + '|' + paymentId;
    const key = Deno.env.get('RAZORPAY_KEY_SECRET') || '0sc8vCquUiQfJNzPtCX2mnDU';
    const hmac = createHmac('sha256', key);
    await hmac.update(text);
    const expectedSignature = await hmac.digest('hex');

    if (expectedSignature !== signature) {
      throw new Error('Invalid signature');
    }

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

    const { data: result, error: processError } = await supabaseClient
      .rpc('process_payment_success', {
        payment_id_input: paymentId,
        order_id_input: orderId,
        plan_id_input: planId
      });

    if (processError) {
      console.error('Payment processing error:', processError);
      throw new Error('Failed to process payment');
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error verifying payment:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Payment verification failed',
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