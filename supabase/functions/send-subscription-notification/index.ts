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

interface SubscriptionNotificationRequest {
  eventType: 'paused' | 'resumed' | 'cancelled';
  subscriptionId: string;
  customerName: string;
  customerEmail: string;
  frequency: string;
  subscriptionSummary: string;
  nextDeliveryDate?: string;
  items: SubscriptionItem[];
  totalAmount: number;
  deliveryType?: string;
}

// Logo URL for email headers
const logoUrl = "https://qscyapmuiqaijvuitlyv.supabase.co/storage/v1/object/public/products/aquavi-email-logo.png";

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT token for authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

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

    // Verify the user is authenticated and has admin role
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Authentication failed:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user has admin role (handles users with multiple role entries)
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin');

    const isAdmin = roleData && roleData.length > 0;
    
    if (!isAdmin) {
      console.error("User is not an admin:", user.id);
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    console.log("Admin user verified:", user.id);

    const notificationData: SubscriptionNotificationRequest = await req.json();
    
    console.log("Processing subscription notification:", notificationData.eventType);
    console.log("Notification data:", JSON.stringify(notificationData));

    // Skip if no customer email
    if (!notificationData.customerEmail) {
      console.log("No customer email provided, skipping notification");
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "No customer email" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Event-specific configurations
    const eventConfig = {
      paused: {
        bannerColor: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
        icon: '⏸️',
        title: 'Subscription Paused',
        subtitle: 'Your recurring delivery is on hold',
        badgeColor: '#FEF3C7',
        badgeTextColor: '#92400E',
        message: 'Your subscription has been paused. No deliveries will be scheduled until you resume.',
        actionText: 'When you\'re ready to resume, contact us at 1-284-443-4353 or reply to this email.',
      },
      resumed: {
        bannerColor: 'linear-gradient(135deg, #039C97 0%, #06B6D4 100%)',
        icon: '▶️',
        title: 'Welcome Back!',
        subtitle: 'Your subscription is now active',
        badgeColor: '#CCFBF1',
        badgeTextColor: '#0D9488',
        message: 'Great news! Your subscription has been resumed and deliveries will continue as scheduled.',
        actionText: 'We\'re excited to continue serving you with fresh water!',
      },
      cancelled: {
        bannerColor: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)',
        icon: '❌',
        title: 'Subscription Cancelled',
        subtitle: 'We\'re sorry to see you go',
        badgeColor: '#FEE2E2',
        badgeTextColor: '#991B1B',
        message: 'Your subscription has been cancelled. No further deliveries will be scheduled.',
        actionText: 'Changed your mind? Contact us anytime to restart your subscription at 1-284-443-4353.',
      },
    };

    const config = eventConfig[notificationData.eventType];

    // Generate items HTML
    const itemsHtml = notificationData.items.map(item => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 14px;">${item.name}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 14px; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 14px; text-align: right;">$${item.price.toFixed(2)}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 14px; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const customerEmailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.title} - Aqua VI</title>
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
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: ${config.bannerColor}; border-radius: 16px; margin-top: -1px;">
                      <tr>
                        <td style="padding: 24px 32px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; width: 48px; height: 48px; text-align: center; vertical-align: middle;">
                                <span style="font-size: 24px;">${config.icon}</span>
                              </td>
                              <td style="padding-left: 16px;">
                                <p style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff;">${config.title}</p>
                                <p style="margin: 4px 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.9);">${config.subtitle}</p>
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
                    <h1 style="margin: 0 0 12px; font-size: 24px; font-weight: 700; color: #111827;">Hi ${notificationData.customerName},</h1>
                    <p style="margin: 0 0 16px; font-size: 16px; color: #374151; line-height: 1.6;">${config.message}</p>
                    <div style="background-color: ${config.badgeColor}; border-radius: 8px; padding: 12px 16px; display: inline-block;">
                      <span style="color: ${config.badgeTextColor}; font-size: 14px; font-weight: 600;">
                        ${notificationData.frequency.toUpperCase()} SUBSCRIPTION
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

                <!-- Schedule Info -->
                <tr>
                  <td style="padding: 24px 40px;">
                    <h2 style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">Your Subscription Details</h2>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f9fafb; border-radius: 8px;">
                      <tr>
                        <td style="padding: 16px;">
                          <p style="margin: 0 0 8px; font-size: 14px; color: #374151;">
                            <strong>Schedule:</strong> ${notificationData.subscriptionSummary}
                          </p>
                          ${notificationData.eventType === 'resumed' && notificationData.nextDeliveryDate ? `
                          <p style="margin: 0 0 8px; font-size: 14px; color: #374151;">
                            <strong>Next Delivery:</strong> ${notificationData.nextDeliveryDate}
                          </p>
                          ` : ''}
                          <p style="margin: 0; font-size: 14px; color: #374151;">
                            <strong>Amount per delivery:</strong> $${notificationData.totalAmount.toFixed(2)}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Items Section -->
                <tr>
                  <td style="padding: 0 40px;">
                    <div style="background-color: #f9fafb; padding: 12px 16px; border-radius: 8px 8px 0 0; border-bottom: 1px solid #e5e7eb;">
                      <h2 style="margin: 0; font-size: 14px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">Subscription Items</h2>
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
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Action Message -->
                <tr>
                  <td style="padding: 24px 40px;">
                    <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 16px;">
                      <p style="margin: 0; font-size: 14px; color: #0369a1; line-height: 1.5;">
                        ${config.actionText}
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
                          <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #111827;">Need help?</p>
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="padding-right: 16px;">
                                <span style="font-size: 14px; color: #6b7280;">Phone: 1-284-443-4353</span>
                              </td>
                              <td style="padding: 0 8px; color: #d1d5db;">|</td>
                              <td>
                                <span style="font-size: 14px; color: #6b7280;">Email: aquavidistributor@gmail.com</span>
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
                    <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">This is an automated message, please do not reply.</p>
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

    // Send the email
    const emailResponse = await transporter.sendMail({
      from: '"Aqua VI Distributor" <aquavidistributor@gmail.com>',
      to: notificationData.customerEmail,
      subject: `${config.title} - Aqua VI`,
      html: customerEmailHtml,
    });

    console.log("Subscription notification email sent:", emailResponse.messageId);

    return new Response(
      JSON.stringify({
        success: true,
        messageId: emailResponse.messageId,
        eventType: notificationData.eventType,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-subscription-notification function:", error);
    return new Response(
      JSON.stringify({ error: "Unable to send notification email. Please try again later." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
