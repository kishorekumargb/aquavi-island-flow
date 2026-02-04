import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.10";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Gmail SMTP configuration
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "aquavidistributor@gmail.com",
    pass: Deno.env.get("GMAIL_APP_PASSWORD"),
  },
});

interface SubscriptionItem {
  name: string;
  quantity: number;
  price: number;
}

interface Subscription {
  id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  delivery_address: string | null;
  delivery_type: string;
  frequency: string;
  preferred_day: string;
  week_of_month: number | null;
  items: SubscriptionItem[];
  total_amount: number;
  next_delivery_date: string;
}

// Logo URL for email headers
const logoUrl = "https://qscyapmuiqaijvuitlyv.supabase.co/storage/v1/object/public/products/aquavi-email-logo.png";

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

const getTimeWindow = (deliveryType: string): string => {
  return deliveryType === 'pickup' ? '9:00 AM - 6:30 PM' : '11:00 AM - 2:30 PM';
};

const generateReminderEmail = (subscription: Subscription): string => {
  const itemsHtml = subscription.items.map(item => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 14px;">${item.name}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 14px; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 14px; text-align: right;">$${item.price.toFixed(2)}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 14px; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const deliveryDate = formatDate(subscription.next_delivery_date);
  const timeWindow = getTimeWindow(subscription.delivery_type);
  const isDelivery = subscription.delivery_type === 'delivery';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Upcoming Delivery Reminder - Aqua VI</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="max-width: 640px; width: 100%;">

          <!-- Logo Header -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 16px 16px 0 0;">
                <tr>
                  <td align="center" style="padding: 32px 20px;">
                    <img src="${logoUrl}" alt="Aqua VI Distributor" width="120" height="120" style="display: block;">
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); overflow: hidden;">

                <!-- Status Banner -->
                <tr>
                  <td style="padding: 0 32px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: linear-gradient(135deg, #214B95 0%, #039C97 100%); border-radius: 16px; margin-top: -1px;">
                      <tr>
                        <td style="padding: 24px 32px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; width: 48px; height: 48px; text-align: center; vertical-align: middle;">
                                <span style="font-size: 24px;">📅</span>
                              </td>
                              <td style="padding-left: 16px;">
                                <p style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff;">UPCOMING ${isDelivery ? 'DELIVERY' : 'PICKUP'}</p>
                                <p style="margin: 4px 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.9);">Your order is coming soon!</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Greeting -->
                <tr>
                  <td style="padding: 32px 40px 24px;">
                    <h1 style="margin: 0 0 12px; font-size: 24px; font-weight: 700; color: #111827;">Hi ${subscription.customer_name},</h1>
                    <p style="margin: 0 0 16px; font-size: 16px; color: #374151; line-height: 1.6;">
                      This is a friendly reminder that your recurring water ${isDelivery ? 'delivery' : 'pickup'} is scheduled for <strong>${deliveryDate}</strong>.
                    </p>
                    <div style="background-color: #DBEAFE; border-radius: 8px; padding: 12px 16px; display: inline-block;">
                      <span style="color: #1E40AF; font-size: 14px; font-weight: 600;">
                        🔔 REMINDER - 3 DAYS AWAY
                      </span>
                    </div>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding: 0 40px;">
                    <div style="height: 1px; background-color: #e5e7eb;"></div>
                  </td>
                </tr>

                <!-- Delivery Details -->
                <tr>
                  <td style="padding: 24px 40px;">
                    <h2 style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">${isDelivery ? 'Delivery' : 'Pickup'} Details</h2>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f9fafb; border-radius: 8px;">
                      <tr>
                        <td style="padding: 16px;">
                          <p style="margin: 0 0 8px; font-size: 14px; color: #374151;">
                            <strong>📆 Date:</strong> ${deliveryDate}
                          </p>
                          <p style="margin: 0 0 8px; font-size: 14px; color: #374151;">
                            <strong>⏰ Time:</strong> ${timeWindow}
                          </p>
                          ${isDelivery && subscription.delivery_address ? `
                          <p style="margin: 0; font-size: 14px; color: #374151;">
                            <strong>📍 Address:</strong> ${subscription.delivery_address}
                          </p>
                          ` : ''}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Items Section -->
                <tr>
                  <td style="padding: 0 40px;">
                    <div style="background-color: #f9fafb; padding: 12px 16px; border-radius: 8px 8px 0 0; border-bottom: 1px solid #e5e7eb;">
                      <h2 style="margin: 0; font-size: 14px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">Your Items</h2>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 0 40px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f9fafb; border-radius: 0 0 8px 8px;">
                      <tr>
                        <td style="padding: 0 16px 16px;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
                            <thead>
                              <tr style="background-color: #214B95;">
                                <th style="padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 600; color: #ffffff; text-transform: uppercase;">Item</th>
                                <th style="padding: 10px 12px; text-align: center; font-size: 12px; font-weight: 600; color: #ffffff; text-transform: uppercase;">Qty</th>
                                <th style="padding: 10px 12px; text-align: right; font-size: 12px; font-weight: 600; color: #ffffff; text-transform: uppercase;">Price</th>
                                <th style="padding: 10px 12px; text-align: right; font-size: 12px; font-weight: 600; color: #ffffff; text-transform: uppercase;">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${itemsHtml}
                              <tr style="background-color: #f0f9ff;">
                                <td colspan="3" style="padding: 12px; font-size: 14px; font-weight: 600; color: #111827;">Total Amount</td>
                                <td style="padding: 12px; text-align: right; font-size: 16px; font-weight: 700; color: #039C97;">$${subscription.total_amount.toFixed(2)}</td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Changes Notice -->
                <tr>
                  <td style="padding: 24px 40px;">
                    <div style="background-color: #FEF3C7; border: 1px solid #FCD34D; border-radius: 8px; padding: 16px;">
                      <p style="margin: 0; font-size: 14px; color: #92400E; line-height: 1.5;">
                        <strong>Need to make changes?</strong><br>
                        Please contact us as soon as possible if you need to modify or skip this delivery.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Support Section -->
                <tr>
                  <td style="padding: 0 40px 32px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f9fafb; border-radius: 8px;">
                      <tr>
                        <td style="padding: 16px;">
                          <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #111827;">Contact Us</p>
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="padding-right: 16px;">
                                <span style="font-size: 14px; color: #6b7280;">📞 1-284-443-4353</span>
                              </td>
                              <td style="padding: 0 8px; color: #d1d5db;">|</td>
                              <td>
                                <span style="font-size: 14px; color: #6b7280;">✉️ aquavidistributor@gmail.com</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 4px; font-size: 14px; color: #6b7280; text-align: center;">Thank you for choosing Aqua VI Distributor.</p>
                    <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">This is an automated reminder, please do not reply.</p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Bottom Branding -->
          <tr>
            <td align="center" style="padding-top: 32px;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">Aqua VI Distributor</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase configuration");
      return new Response(
        JSON.stringify({ error: "Service configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body for reminder_days (default to 3)
    let reminderDays = 3;
    try {
      const body = await req.json();
      if (body.reminder_days && typeof body.reminder_days === 'number') {
        reminderDays = body.reminder_days;
      }
    } catch {
      // Use default if no body
    }

    // Calculate the target date (today + reminder_days)
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + reminderDays);
    const targetDateStr = targetDate.toISOString().split('T')[0];

    console.log(`Looking for active subscriptions with next_delivery_date = ${targetDateStr}`);

    // Query active subscriptions due in reminder_days days
    const { data: subscriptions, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('status', 'active')
      .eq('next_delivery_date', targetDateStr);

    if (fetchError) {
      console.error("Error fetching subscriptions:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch subscriptions" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${subscriptions?.length || 0} subscriptions due on ${targetDateStr}`);

    const results: Array<{ subscriptionId: string; success: boolean; error?: string; skipped?: boolean }> = [];

    for (const sub of (subscriptions || [])) {
      // Skip if no email
      if (!sub.customer_email) {
        console.log(`Skipping subscription ${sub.id} - no email address`);
        results.push({ subscriptionId: sub.id, success: true, skipped: true });
        continue;
      }

      try {
        const subscription: Subscription = {
          ...sub,
          items: Array.isArray(sub.items) ? sub.items : [],
        };

        const emailHtml = generateReminderEmail(subscription);

        const emailResponse = await transporter.sendMail({
          from: '"Aqua VI Distributor" <aquavidistributor@gmail.com>',
          to: subscription.customer_email,
          subject: `Upcoming ${subscription.delivery_type === 'pickup' ? 'Pickup' : 'Delivery'} Reminder - Aqua VI`,
          html: emailHtml,
        });

        console.log(`Reminder email sent to ${subscription.customer_email} for subscription ${subscription.id}:`, emailResponse.messageId);
        results.push({ subscriptionId: subscription.id, success: true });

      } catch (emailError: any) {
        console.error(`Failed to send reminder for subscription ${sub.id}:`, emailError);
        results.push({ subscriptionId: sub.id, success: false, error: emailError.message });
      }
    }

    const sent = results.filter(r => r.success && !r.skipped).length;
    const skipped = results.filter(r => r.skipped).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`Reminder emails summary: ${sent} sent, ${skipped} skipped (no email), ${failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        targetDate: targetDateStr,
        reminderDays,
        sent,
        skipped,
        failed,
        results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-upcoming-delivery-reminder function:", error);
    return new Response(
      JSON.stringify({ error: "Unable to send reminder emails. Please try again later." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
