import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface SubscriptionOrderResult {
  subscription_id: string;
  customer_name: string;
  order_id?: string;
  order_number?: string;
  success: boolean;
  error?: string;
  email_sent?: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[generate-subscription-orders] Starting automated order generation...');

  try {
    // Create Supabase client with service role for cron context
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Parse optional parameters from request body
    let leadDays = 2; // Default: generate orders 2 days before delivery
    let dryRun = false;
    let specificSubscriptionId: string | null = null;

    try {
      const body = await req.json();
      if (body.lead_days !== undefined) leadDays = body.lead_days;
      if (body.dry_run !== undefined) dryRun = body.dry_run;
      if (body.subscription_id !== undefined) specificSubscriptionId = body.subscription_id;
    } catch {
      // No body or invalid JSON, use defaults
    }

    console.log(`[generate-subscription-orders] Config: leadDays=${leadDays}, dryRun=${dryRun}, specificSubscriptionId=${specificSubscriptionId || 'all'}`);

    // Query active subscriptions due soon (or specific subscription)
    let query = supabase
      .from('subscriptions')
      .select('*')
      .eq('status', 'active');

    if (specificSubscriptionId) {
      // Manual trigger for specific subscription
      query = query.eq('id', specificSubscriptionId);
    } else {
      // Automated: find subscriptions with next_delivery_date <= today + lead_days
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + leadDays);
      const targetDateStr = targetDate.toISOString().split('T')[0];
      
      console.log(`[generate-subscription-orders] Looking for subscriptions with next_delivery_date <= ${targetDateStr}`);
      query = query.lte('next_delivery_date', targetDateStr);
    }

    const { data: dueSubscriptions, error: fetchError } = await query;

    if (fetchError) {
      console.error('[generate-subscription-orders] Error fetching subscriptions:', fetchError);
      throw fetchError;
    }

    console.log(`[generate-subscription-orders] Found ${dueSubscriptions?.length || 0} subscriptions due for order generation`);

    if (!dueSubscriptions || dueSubscriptions.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No subscriptions due for order generation',
          generated: 0,
          failed: 0,
          results: [],
          execution_time_ms: Date.now() - startTime
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process each subscription
    const results: SubscriptionOrderResult[] = [];
    let generated = 0;
    let failed = 0;

    for (const subscription of dueSubscriptions) {
      console.log(`[generate-subscription-orders] Processing subscription ${subscription.id} for ${subscription.customer_name}`);
      
      const result: SubscriptionOrderResult = {
        subscription_id: subscription.id,
        customer_name: subscription.customer_name,
        success: false
      };

      if (dryRun) {
        console.log(`[generate-subscription-orders] DRY RUN: Would generate order for ${subscription.customer_name}`);
        result.success = true;
        results.push(result);
        generated++;
        continue;
      }

      try {
        // Call the RPC function to generate order
        const { data: orderResult, error: rpcError } = await supabase.rpc(
          'generate_order_from_subscription',
          { p_subscription_id: subscription.id }
        );

        if (rpcError) {
          console.error(`[generate-subscription-orders] RPC error for ${subscription.id}:`, rpcError);
          result.error = rpcError.message;
          results.push(result);
          failed++;
          continue;
        }

        console.log(`[generate-subscription-orders] Order created:`, orderResult);
        
        result.success = true;
        result.order_id = orderResult.order_id;
        result.order_number = orderResult.order_number;

        // Send order confirmation email if customer has email
        if (subscription.customer_email) {
          try {
            const { error: emailError } = await supabase.functions.invoke('send-order-confirmation', {
              body: {
                orderId: orderResult.order_id,
                orderNumber: orderResult.order_number,
                customerName: subscription.customer_name,
                customerEmail: subscription.customer_email,
                items: subscription.items,
                totalAmount: subscription.total_amount,
                deliveryType: subscription.delivery_type,
                deliveryAddress: subscription.delivery_address,
                isSubscriptionOrder: true,
                subscriptionFrequency: subscription.frequency,
                nextDeliveryDate: orderResult.next_delivery_date
              }
            });

            if (emailError) {
              console.error(`[generate-subscription-orders] Email error for ${subscription.id}:`, emailError);
              result.email_sent = false;
            } else {
              console.log(`[generate-subscription-orders] Confirmation email sent to ${subscription.customer_email}`);
              result.email_sent = true;
            }
          } catch (emailErr) {
            console.error(`[generate-subscription-orders] Email exception for ${subscription.id}:`, emailErr);
            result.email_sent = false;
          }
        } else {
          console.log(`[generate-subscription-orders] No email for ${subscription.customer_name}, skipping notification`);
        }

        results.push(result);
        generated++;

      } catch (err) {
        console.error(`[generate-subscription-orders] Exception for ${subscription.id}:`, err);
        result.error = err instanceof Error ? err.message : 'Unknown error';
        results.push(result);
        failed++;
      }
    }

    const executionTime = Date.now() - startTime;
    console.log(`[generate-subscription-orders] Completed: ${generated} generated, ${failed} failed in ${executionTime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Generated ${generated} orders, ${failed} failed`,
        generated,
        failed,
        results,
        execution_time_ms: executionTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[generate-subscription-orders] Fatal error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        execution_time_ms: Date.now() - startTime
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
