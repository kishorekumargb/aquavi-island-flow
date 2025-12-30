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

// Logo URL for email headers
const logoUrl = "https://qscyapmuiqaijvuitlyv.supabase.co/storage/v1/object/public/products/aquavi-email-logo.png";
// Admin dashboard URL
const adminDashboardUrl = "https://aquavidistributor.com/access-water-360";

interface DeliveryConfirmationRequest {
  orderId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.error("Missing Supabase configuration");
      return new Response(
        JSON.stringify({ error: "Service configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create client with user's auth token to verify identity
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      console.error("User authentication failed:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Use service role for role check and data access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user has a valid role (admin or user)
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'user'])
      .single();

    if (roleError || !roleData) {
      console.error("User does not have required role:", user.id);
      return new Response(
        JSON.stringify({ error: "Forbidden: Access denied" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("User verified with role:", roleData.role, "- processing delivery confirmation");

    const { orderId }: DeliveryConfirmationRequest = await req.json();
    
    console.log("Processing delivery confirmation for order ID:", orderId);
    
    // Fetch order details from database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
    
    if (orderError || !order) {
      console.error("Order not found:", orderId, orderError);
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Order found:", order.order_number);

    const isPickup = order.delivery_type === 'pickup';
    const deliveryInfoText = isPickup 
      ? 'Pickup from Aqua VI Store'
      : order.delivery_address || 'Delivery address';

    // Parse items from order
    const items = Array.isArray(order.items) ? order.items : [];
    
    // Generate order items HTML
    const itemsHtml = items.map((item: any) => `
                              <tr>
                                <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 14px;">${item.name}</td>
                                <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 14px; text-align: center;">${item.quantity}</td>
                                <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 14px; text-align: right;">$${Number(item.price).toFixed(2)}</td>
                                <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 14px; text-align: right;">$${(Number(item.price) * item.quantity).toFixed(2)}</td>
                              </tr>`).join('');

    // Customer delivery confirmation email - GREEN theme
    const customerEmailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Delivery Confirmation - Aqua VI</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="display: none; max-height: 0; overflow: hidden;">
    Your Aqua VI order ${order.order_number} has been ${isPickup ? 'picked up' : 'delivered'}.
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%;">

          <!-- Logo Header (Integrated) -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 16px 16px 0 0; padding: 32px 0;">
                <tr>
                  <td align="center" style="padding: 32px 20px;">
                    <img src="${logoUrl}" alt="Aqua VI" width="80" height="80" style="display: block; margin-bottom: 16px;">
                    <p style="margin: 0; font-size: 28px; font-weight: 700;">
                      <span style="color: #214B95;">AQUA </span><span style="color: #039C97;">VI</span>
                    </p>
                    <p style="margin: 4px 0 0; font-size: 18px; font-weight: 700; color: #214B95;">DISTRIBUTOR</p>
                    <p style="margin: 12px 0 0; font-size: 14px; color: #6b7280;">Premium Water Delivery</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); overflow: hidden;">

                <!-- Status Banner - GREEN for Delivery -->
                <tr>
                  <td style="padding: 0 32px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: linear-gradient(135deg, #16A34A 0%, #22C55E 100%); border-radius: 16px; margin-top: -1px;">
                      <tr>
                        <td style="padding: 24px 32px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; width: 48px; height: 48px; text-align: center; vertical-align: middle;">
                                <span style="font-size: 24px; color: #ffffff;">✓</span>
                              </td>
                              <td style="padding-left: 16px;">
                                <p style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff;">${isPickup ? 'Order Picked Up!' : 'Order Delivered!'}</p>
                                <p style="margin: 4px 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.9);">Successfully completed</p>
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
                    <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: #111827;">Thanks, ${order.customer_name}</h1>
                    <p style="margin: 0; font-size: 16px; color: #6b7280; line-height: 1.5;">Great news! Your order has been successfully ${isPickup ? 'picked up' : 'delivered'}. We hope you enjoy your Aqua VI premium water!</p>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top: 16px;">
                      <tr>
                        <td>
                          <span style="font-size: 14px; color: #6b7280;">Order # ${order.order_number}</span>
                        </td>
                        <td style="padding: 0 12px;">
                          <span style="color: #d1d5db;">|</span>
                        </td>
                        <td>
                          <span style="font-size: 14px; font-weight: 600; color: #16A34A;">$${Number(order.total_amount).toFixed(2)}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding: 0 40px;">
                    <div style="height: 1px; background-color: #e5e7eb;"></div>
                  </td>
                </tr>

                <!-- Status Timeline -->
                <tr>
                  <td style="padding: 24px 40px;">
                    <h2 style="margin: 0 0 20px; font-size: 14px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">Status</h2>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding-bottom: 16px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="vertical-align: top; padding-right: 12px;">
                                <div style="width: 24px; height: 24px; background-color: #16A34A; border-radius: 50%; text-align: center; line-height: 24px;">
                                  <span style="color: white; font-size: 12px;">✓</span>
                                </div>
                              </td>
                              <td style="vertical-align: top;">
                                <p style="margin: 0; font-size: 14px; font-weight: 600; color: #111827;">Received</p>
                                <p style="margin: 4px 0 0; font-size: 13px; color: #6b7280;">Confirmed in system</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 16px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="vertical-align: top; padding-right: 12px;">
                                <div style="width: 24px; height: 24px; background-color: #16A34A; border-radius: 50%; text-align: center; line-height: 24px;">
                                  <span style="color: white; font-size: 12px;">✓</span>
                                </div>
                              </td>
                              <td style="vertical-align: top;">
                                <p style="margin: 0; font-size: 14px; font-weight: 600; color: #111827;">Prepared</p>
                                <p style="margin: 4px 0 0; font-size: 13px; color: #6b7280;">Items packed</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="vertical-align: top; padding-right: 12px;">
                                <div style="width: 24px; height: 24px; background-color: #16A34A; border-radius: 50%; text-align: center; line-height: 24px;">
                                  <span style="color: white; font-size: 12px;">✓</span>
                                </div>
                              </td>
                              <td style="vertical-align: top;">
                                <p style="margin: 0; font-size: 14px; font-weight: 600; color: #16A34A;">${isPickup ? 'Picked Up' : 'Delivered'}</p>
                                <p style="margin: 4px 0 0; font-size: 13px; color: #6b7280;">Completed successfully</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Order Details Section Header -->
                <tr>
                  <td style="padding: 0 40px;">
                    <div style="background-color: #f0fdf4; padding: 12px 16px; border-radius: 8px 8px 0 0; border-bottom: 1px solid #bbf7d0;">
                      <h2 style="margin: 0; font-size: 14px; font-weight: 600; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">Order Summary</h2>
                    </div>
                  </td>
                </tr>

                <!-- Delivery/Pickup Info -->
                <tr>
                  <td style="padding: 0 40px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f0fdf4;">
                      <tr>
                        <td style="padding: 16px; width: 50%; vertical-align: top;">
                          <p style="margin: 0 0 4px; font-size: 12px; font-weight: 600; color: #166534; text-transform: uppercase;">${isPickup ? 'Pickup Location' : 'Delivered To'}</p>
                          <p style="margin: 0; font-size: 14px; color: #111827; line-height: 1.4;">${deliveryInfoText}</p>
                        </td>
                        <td style="padding: 16px; width: 50%; vertical-align: top;">
                          <p style="margin: 0 0 4px; font-size: 12px; font-weight: 600; color: #166534; text-transform: uppercase;">Payment & Type</p>
                          <p style="margin: 0; font-size: 14px; color: #111827;">Method: ${order.payment_method || 'Cash'}</p>
                          <p style="margin: 4px 0 0; font-size: 14px; color: #111827;">Order: ${isPickup ? 'Pickup' : 'Delivery'}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Items Section Header -->
                <tr>
                  <td style="padding: 24px 40px 0;">
                    <div style="background-color: #f0fdf4; padding: 12px 16px; border-radius: 8px 8px 0 0; border-bottom: 1px solid #bbf7d0;">
                      <h2 style="margin: 0; font-size: 14px; font-weight: 600; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">Items</h2>
                    </div>
                  </td>
                </tr>

                <!-- Items Table -->
                <tr>
                  <td style="padding: 0 40px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f0fdf4;">
                      <tr>
                        <td style="padding: 0 16px 16px;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #bbf7d0;">
                            <thead>
                              <tr style="background-color: #16A34A;">
                                <th style="padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #ffffff; text-transform: uppercase;">Item</th>
                                <th style="padding: 12px 16px; text-align: center; font-size: 12px; font-weight: 600; color: #ffffff; text-transform: uppercase;">Qty</th>
                                <th style="padding: 12px 16px; text-align: right; font-size: 12px; font-weight: 600; color: #ffffff; text-transform: uppercase;">Price</th>
                                <th style="padding: 12px 16px; text-align: right; font-size: 12px; font-weight: 600; color: #ffffff; text-transform: uppercase;">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${itemsHtml}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                      <!-- Order Total -->
                      <tr>
                        <td style="padding: 0 16px 16px;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #16A34A; border-radius: 8px;">
                            <tr>
                              <td style="padding: 16px;">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                  <tr>
                                    <td style="font-size: 16px; font-weight: 600; color: #ffffff;">Order total</td>
                                    <td style="text-align: right; font-size: 24px; font-weight: 700; color: #ffffff;">$${Number(order.total_amount).toFixed(2)}</td>
                                  </tr>
                                  <tr>
                                    <td colspan="2" style="padding-top: 8px;">
                                      <p style="margin: 0; font-size: 13px; color: rgba(255, 255, 255, 0.8);">Payment method: ${order.payment_method || 'Cash'}</p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Thank You Message -->
                <tr>
                  <td style="padding: 24px 40px;">
                    <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px;">
                      <p style="margin: 0; font-size: 14px; font-weight: 600; color: #92400e;">💧 Thank you for choosing Aqua VI!</p>
                      <p style="margin: 8px 0 0; font-size: 14px; color: #92400e;">We appreciate your business and look forward to serving you again.</p>
                    </div>
                  </td>
                </tr>

                <!-- Support Section -->
                <tr>
                  <td style="padding: 0 40px 32px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f9fafb; border-radius: 8px;">
                      <tr>
                        <td style="padding: 16px;">
                          <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #111827;">Need help with your order?</p>
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="padding-right: 16px;">
                                <span style="font-size: 14px; color: #6b7280;">Phone: 1-499-4611</span>
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
                  <td style="background-color: #f0fdf4; padding: 24px 40px; border-top: 1px solid #bbf7d0;">
                    <p style="margin: 0 0 4px; font-size: 14px; color: #166534; text-align: center;">Thank you for choosing Aqua VI Distributor.</p>
                    <p style="margin: 0; font-size: 12px; color: #6b7280; text-align: center;">This is an automated message, please do not reply.</p>
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

    // Business notification email - GREEN theme for delivery confirmation
    const businessEmailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Delivery Complete - Aqua VI</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%;">

          <!-- Logo Header (Integrated) -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 16px 16px 0 0; padding: 32px 0;">
                <tr>
                  <td align="center" style="padding: 32px 20px;">
                    <img src="${logoUrl}" alt="Aqua VI" width="80" height="80" style="display: block; margin-bottom: 16px;">
                    <p style="margin: 0; font-size: 28px; font-weight: 700;">
                      <span style="color: #214B95;">AQUA </span><span style="color: #039C97;">VI</span>
                    </p>
                    <p style="margin: 4px 0 0; font-size: 18px; font-weight: 700; color: #214B95;">DISTRIBUTOR</p>
                    <p style="margin: 12px 0 0; font-size: 14px; color: #6b7280;">Internal Notification</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); overflow: hidden;">

                <!-- Status Banner - GREEN for Delivery -->
                <tr>
                  <td style="padding: 0 32px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: linear-gradient(135deg, #16A34A 0%, #22C55E 100%); border-radius: 16px; margin-top: -1px;">
                      <tr>
                        <td style="padding: 24px 32px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; width: 48px; height: 48px; text-align: center; vertical-align: middle;">
                                <span style="font-size: 24px; color: #ffffff;">✓</span>
                              </td>
                              <td style="padding-left: 16px;">
                                <p style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff;">ORDER ${isPickup ? 'PICKED UP' : 'DELIVERED'}</p>
                                <p style="margin: 4px 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.9);">Successfully completed</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Order Summary -->
                <tr>
                  <td style="padding: 32px 40px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f0fdf4; border-radius: 12px; border-left: 4px solid #16A34A;">
                      <tr>
                        <td style="padding: 20px;">
                          <h3 style="margin: 0 0 16px; font-size: 18px; font-weight: 700; color: #166534;">Order: ${order.order_number}</h3>
                          <p style="margin: 0 0 8px; font-size: 14px; color: #374151;"><strong>Customer:</strong> ${order.customer_name}</p>
                          <p style="margin: 0 0 8px; font-size: 14px; color: #374151;"><strong>Email:</strong> ${order.customer_email || 'Not provided'}</p>
                          ${order.customer_phone ? `<p style="margin: 0 0 8px; font-size: 14px; color: #374151;"><strong>Phone:</strong> ${order.customer_phone}</p>` : ''}
                          <p style="margin: 0 0 8px; font-size: 14px; color: #374151;"><strong>${isPickup ? 'Pickup' : 'Delivery'} Completed:</strong> ${new Date().toLocaleString()}</p>
                          <p style="margin: 0 0 8px; font-size: 14px; color: #374151;">
                            <strong>Order Type:</strong> 
                            <span style="background-color: ${isPickup ? '#FEF3C7' : '#DBEAFE'}; padding: 2px 8px; border-radius: 4px; font-weight: bold;">${isPickup ? '📦 PICKUP' : '🚚 DELIVERY'}</span>
                          </p>
                          <p style="margin: 16px 0 0; font-size: 20px; color: #16A34A;"><strong>Total Amount: $${Number(order.total_amount).toFixed(2)}</strong></p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Items Table -->
                <tr>
                  <td style="padding: 0 40px 24px;">
                    <h3 style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #374151;">Order Items:</h3>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
                      <thead>
                        <tr style="background-color: #f9fafb;">
                          <th style="padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; border-bottom: 1px solid #e5e7eb;">Item</th>
                          <th style="padding: 12px 16px; text-align: center; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; border-bottom: 1px solid #e5e7eb;">Qty</th>
                          <th style="padding: 12px 16px; text-align: right; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; border-bottom: 1px solid #e5e7eb;">Price</th>
                          <th style="padding: 12px 16px; text-align: right; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; border-bottom: 1px solid #e5e7eb;">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsHtml}
                      </tbody>
                    </table>
                  </td>
                </tr>

                <!-- Completion Notice -->
                <tr>
                  <td style="padding: 0 40px 32px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f0fdf4; border-radius: 12px;">
                      <tr>
                        <td style="padding: 24px; text-align: center;">
                          <p style="margin: 0; font-size: 16px; font-weight: 600; color: #166534;">🎉 Order completed successfully!</p>
                          <p style="margin: 8px 0 0; font-size: 14px; color: #166534;">Customer has been notified.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    let customerEmailResponse = null;
    let businessEmailResponse = null;

    // Send customer delivery confirmation email only if email provided
    if (order.customer_email) {
      try {
        customerEmailResponse = await transporter.sendMail({
          from: '"Aqua VI Distributor" <aquavidistributor@gmail.com>',
          to: order.customer_email,
          subject: `✅ ${isPickup ? 'Pickup' : 'Delivery'} Complete - Order ${order.order_number}`,
          html: customerEmailHtml,
        });
        console.log("Customer delivery email sent:", customerEmailResponse.messageId);
      } catch (emailError) {
        console.error("Error sending customer delivery email:", emailError);
      }
    } else {
      console.log("No customer email provided, skipping customer notification");
    }

    // Send business notification email
    try {
      businessEmailResponse = await transporter.sendMail({
        from: '"Aqua VI Distributor" <aquavidistributor@gmail.com>',
        to: "aquavidistributor@gmail.com",
        subject: `✅ Order Delivered: ${order.order_number} - $${Number(order.total_amount).toFixed(2)}`,
        html: businessEmailHtml,
      });
      console.log("Business delivery email sent:", businessEmailResponse.messageId);
    } catch (emailError) {
      console.error("Error sending business delivery email:", emailError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        customerEmail: customerEmailResponse ? { messageId: customerEmailResponse.messageId } : null,
        businessEmail: businessEmailResponse ? { messageId: businessEmailResponse.messageId } : null,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-delivery-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: "Unable to send delivery confirmation emails." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
