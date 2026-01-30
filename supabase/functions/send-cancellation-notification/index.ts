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

interface CancellationNotificationRequest {
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
      .limit(1);

    if (roleError || !roleData || roleData.length === 0) {
      console.error("User does not have required role:", user.id);
      return new Response(
        JSON.stringify({ error: "Forbidden: Access denied" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("User verified with role:", roleData[0].role, "- processing cancellation notification");

    const { orderId }: CancellationNotificationRequest = await req.json();
    
    console.log("Processing cancellation notification for order ID:", orderId);
    
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

    // Parse items from order
    const items = Array.isArray(order.items) ? order.items : [];
    
    // Fetch product details from database to get actual size descriptions
    const productNames = items.map((item: any) => item.name);
    const { data: products } = await supabase
      .from('products')
      .select('name, size')
      .in('name', productNames);
    
    // Create a map for quick lookup of product sizes
    const productSizeMap: Record<string, string> = {};
    if (products) {
      products.forEach((product: { name: string; size: string }) => {
        productSizeMap[product.name] = product.size;
      });
    }
    
    // Generate order items HTML with actual product size descriptions
    const itemsHtml = items.map((item: any) => {
      const sizeDescription = productSizeMap[item.name] || '';
      const displayName = sizeDescription ? `${item.name} (${sizeDescription})` : item.name;
      return `
                              <tr>
                                <td style="padding: 12px 16px; border-bottom: 1px solid #fecaca; color: #374151; font-size: 14px;">${displayName}</td>
                                <td style="padding: 12px 16px; border-bottom: 1px solid #fecaca; color: #374151; font-size: 14px; text-align: center;">${item.quantity}</td>
                                <td style="padding: 12px 16px; border-bottom: 1px solid #fecaca; color: #374151; font-size: 14px; text-align: right;">$${Number(item.price).toFixed(2)}</td>
                                <td style="padding: 12px 16px; border-bottom: 1px solid #fecaca; color: #374151; font-size: 14px; text-align: right;">$${(Number(item.price) * item.quantity).toFixed(2)}</td>
                              </tr>`;
    }).join('');

    // Customer cancellation notification email - RED theme
    const customerEmailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Cancelled - Aqua VI</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="display: none; max-height: 0; overflow: hidden;">
    Your Aqua VI order ${order.order_number} has been cancelled.
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="max-width: 640px; width: 100%;">

          <!-- Logo Header (Integrated) -->
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

                <!-- Status Banner - RED for Cancellation -->
                <tr>
                  <td style="padding: 0 32px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%); border-radius: 16px; margin-top: -1px;">
                      <tr>
                        <td style="padding: 24px 32px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; width: 48px; height: 48px; text-align: center; vertical-align: middle;">
                                <span style="font-size: 24px; color: #ffffff;">✕</span>
                              </td>
                              <td style="padding-left: 16px;">
                                <p style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff;">Order Cancelled</p>
                                <p style="margin: 4px 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.9);">We're sorry to see you go</p>
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
                    <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: #111827;">Dear ${order.customer_name}</h1>
                    <p style="margin: 0; font-size: 16px; color: #6b7280; line-height: 1.5;">We regret to inform you that your order has been cancelled. If you have any questions about this cancellation, please contact us.</p>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top: 16px;">
                      <tr>
                        <td>
                          <span style="font-size: 14px; color: #6b7280;">Order # ${order.order_number}</span>
                        </td>
                        <td style="padding: 0 12px;">
                          <span style="color: #d1d5db;">|</span>
                        </td>
                        <td>
                          <span style="font-size: 14px; font-weight: 600; color: #DC2626; text-decoration: line-through;">$${Number(order.total_amount).toFixed(2)}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding: 0 40px;">
                    <div style="height: 1px; background-color: #fecaca;"></div>
                  </td>
                </tr>

                <!-- Cancelled Order Details -->
                <tr>
                  <td style="padding: 24px 40px;">
                    <div style="background-color: #FEF2F2; padding: 20px; border-radius: 12px; border-left: 4px solid #DC2626;">
                      <h2 style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #991B1B;">Cancelled Order Details</h2>
                      <p style="margin: 0 0 8px; font-size: 14px; color: #374151;"><strong>Order Number:</strong> ${order.order_number}</p>
                      <p style="margin: 0 0 8px; font-size: 14px; color: #374151;"><strong>Order Type:</strong> ${isPickup ? 'Pickup' : 'Delivery'}</p>
                      <p style="margin: 0; font-size: 14px; color: #374151;"><strong>Original Total:</strong> <span style="text-decoration: line-through;">$${Number(order.total_amount).toFixed(2)}</span></p>
                    </div>
                  </td>
                </tr>

                <!-- Items Section Header -->
                <tr>
                  <td style="padding: 0 40px;">
                    <div style="background-color: #FEF2F2; padding: 12px 16px; border-radius: 8px 8px 0 0; border-bottom: 1px solid #fecaca;">
                      <h2 style="margin: 0; font-size: 14px; font-weight: 600; color: #991B1B; text-transform: uppercase; letter-spacing: 0.5px;">Cancelled Items</h2>
                    </div>
                  </td>
                </tr>

                <!-- Items Table -->
                <tr>
                  <td style="padding: 0 40px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FEF2F2;">
                      <tr>
                        <td style="padding: 0 16px 16px;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #fecaca;">
                            <thead>
                              <tr style="background-color: #DC2626;">
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
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #991B1B; border-radius: 8px;">
                            <tr>
                              <td style="padding: 16px;">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                  <tr>
                                    <td style="font-size: 16px; font-weight: 600; color: #ffffff;">Total Amount</td>
                                    <td style="text-align: right; font-size: 24px; font-weight: 700; color: #ffffff; text-decoration: line-through;">$${Number(order.total_amount).toFixed(2)}</td>
                                  </tr>
                                  <tr>
                                    <td colspan="2" style="padding-top: 8px;">
                                      <p style="margin: 0; font-size: 13px; color: rgba(255, 255, 255, 0.8);">Order has been cancelled</p>
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

                <!-- Future Order Message -->
                <tr>
                  <td style="padding: 24px 40px;">
                    <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px;">
                      <p style="margin: 0; font-size: 14px; font-weight: 600; color: #92400e;">💧 We appreciate your interest in Aqua VI!</p>
                      <p style="margin: 8px 0 0; font-size: 14px; color: #92400e;">We hope to serve you again in the future. Feel free to place a new order anytime.</p>
                    </div>
                  </td>
                </tr>

                <!-- Support Section -->
                <tr>
                  <td style="padding: 0 40px 32px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f9fafb; border-radius: 8px;">
                      <tr>
                        <td style="padding: 16px;">
                          <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #111827;">Have questions about the cancellation?</p>
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
                  <td style="background-color: #FEF2F2; padding: 24px 40px; border-top: 1px solid #fecaca;">
                    <p style="margin: 0 0 4px; font-size: 14px; color: #991B1B; text-align: center;">Thank you for considering Aqua VI Distributor.</p>
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

    // Business notification email - RED theme for cancellation
    const businessEmailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Cancelled - Aqua VI</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="max-width: 640px; width: 100%;">

          <!-- Logo Header (Integrated) -->
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

                <!-- Status Banner - RED for Cancellation -->
                <tr>
                  <td style="padding: 0 32px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%); border-radius: 16px; margin-top: -1px;">
                      <tr>
                        <td style="padding: 24px 32px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; width: 48px; height: 48px; text-align: center; vertical-align: middle;">
                                <span style="font-size: 24px; color: #ffffff;">✕</span>
                              </td>
                              <td style="padding-left: 16px;">
                                <p style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff;">ORDER CANCELLED</p>
                                <p style="margin: 4px 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.9);">Revenue lost</p>
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
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FEF2F2; border-radius: 12px; border-left: 4px solid #DC2626;">
                      <tr>
                        <td style="padding: 20px;">
                          <h3 style="margin: 0 0 16px; font-size: 18px; font-weight: 700; color: #991B1B;">Order: ${order.order_number}</h3>
                          <p style="margin: 0 0 8px; font-size: 14px; color: #374151;"><strong>Customer:</strong> ${order.customer_name}</p>
                          <p style="margin: 0 0 8px; font-size: 14px; color: #374151;"><strong>Email:</strong> ${order.customer_email || 'Not provided'}</p>
                          ${order.customer_phone ? `<p style="margin: 0 0 8px; font-size: 14px; color: #374151;"><strong>Phone:</strong> ${order.customer_phone}</p>` : ''}
                          <p style="margin: 0 0 8px; font-size: 14px; color: #374151;"><strong>Cancelled At:</strong> ${new Date().toLocaleString()}</p>
                          <p style="margin: 0 0 8px; font-size: 14px; color: #374151;">
                            <strong>Order Type:</strong> 
                            <span style="background-color: ${isPickup ? '#FEF3C7' : '#DBEAFE'}; padding: 2px 8px; border-radius: 4px; font-weight: bold;">${isPickup ? '📦 PICKUP' : '🚚 DELIVERY'}</span>
                          </p>
                          <p style="margin: 16px 0 0; font-size: 20px; color: #DC2626;"><strong>Lost Revenue: $${Number(order.total_amount).toFixed(2)}</strong></p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Items Table -->
                <tr>
                  <td style="padding: 0 40px 24px;">
                    <h3 style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #374151;">Cancelled Items:</h3>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #fecaca;">
                      <thead>
                        <tr style="background-color: #f9fafb;">
                          <th style="padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; border-bottom: 1px solid #fecaca;">Item</th>
                          <th style="padding: 12px 16px; text-align: center; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; border-bottom: 1px solid #fecaca;">Qty</th>
                          <th style="padding: 12px 16px; text-align: right; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; border-bottom: 1px solid #fecaca;">Price</th>
                          <th style="padding: 12px 16px; text-align: right; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; border-bottom: 1px solid #fecaca;">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsHtml}
                      </tbody>
                    </table>
                  </td>
                </tr>

                <!-- Cancellation Notice -->
                <tr>
                  <td style="padding: 0 40px 32px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FEF2F2; border-radius: 12px;">
                      <tr>
                        <td style="padding: 24px; text-align: center;">
                          <p style="margin: 0; font-size: 16px; font-weight: 600; color: #991B1B;">Order has been cancelled and customer notified.</p>
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

    // Send customer cancellation notification email only if email provided
    if (order.customer_email) {
      try {
        customerEmailResponse = await transporter.sendMail({
          from: '"Aqua VI Distributor" <aquavidistributor@gmail.com>',
          to: order.customer_email,
          subject: `❌ Order Cancelled - ${order.order_number}`,
          html: customerEmailHtml,
        });
        console.log("Customer cancellation email sent:", customerEmailResponse.messageId);
      } catch (emailError) {
        console.error("Error sending customer cancellation email:", emailError);
      }
    } else {
      console.log("No customer email provided, skipping customer notification");
    }

    // Send business notification email
    try {
      businessEmailResponse = await transporter.sendMail({
        from: '"Aqua VI Distributor" <aquavidistributor@gmail.com>',
        to: "aquavidistributor@gmail.com",
        subject: `❌ Order Cancelled: ${order.order_number} - Lost $${Number(order.total_amount).toFixed(2)}`,
        html: businessEmailHtml,
      });
      console.log("Business cancellation email sent:", businessEmailResponse.messageId);
    } catch (emailError) {
      console.error("Error sending business cancellation email:", emailError);
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
    console.error("Error in send-cancellation-notification function:", error);
    return new Response(
      JSON.stringify({ error: "Unable to send cancellation notification emails." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
