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

interface OrderItem {
  id: string;
  name: string;
  size: string;
  price: number;
  quantity: number;
}

interface OrderConfirmationRequest {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  deliveryAddress: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: string;
  deliveryType: string;
}

// Logo URL for email headers
const logoUrl = "https://qscyapmuiqaijvuitlyv.supabase.co/storage/v1/object/public/products/aquavi-email-logo.png";
// Admin dashboard URL
const adminDashboardUrl = "https://aquavidistributor.com/access-water-360";

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const orderData: OrderConfirmationRequest = await req.json();
    
    console.log("Processing order confirmation emails for order:", orderData.orderNumber);
    console.log("Order data received:", JSON.stringify(orderData));

    // Verify order exists in database to prevent abuse
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
    
    // Verify the order exists and matches provided data
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('order_number, customer_email, total_amount, delivery_type, confirmation_sent_at')
      .eq('order_number', orderData.orderNumber)
      .single();
    
    if (orderError || !order) {
      console.error("Order not found:", orderData.orderNumber);
      return new Response(
        JSON.stringify({ error: "Invalid order" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Order verified from database:", order);

    // SECURITY: Prevent duplicate confirmation emails - check if already sent
    if (order.confirmation_sent_at) {
      console.log("Confirmation already sent for order:", orderData.orderNumber, "at:", order.confirmation_sent_at);
      return new Response(
        JSON.stringify({ error: "Confirmation already sent", already_sent: true }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate email matches the order (if email was provided in order)
    if (order.customer_email && orderData.customerEmail && 
        order.customer_email.toLowerCase() !== orderData.customerEmail.toLowerCase()) {
      console.error("Email mismatch for order:", orderData.orderNumber);
      return new Response(
        JSON.stringify({ error: "Invalid request" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Skip sending if no customer email provided
    if (!orderData.customerEmail) {
      console.log("No customer email provided, skipping customer notification");
    }

    // Determine delivery info text based on delivery type
    const isPickup = orderData.deliveryType === 'pickup';
    const deliveryInfoText = isPickup 
      ? 'Pickup Location: Aqua VI Store - Contact us for pickup details'
      : orderData.deliveryAddress || 'To be confirmed';

    // Fetch product details from database to get actual size descriptions
    const productNames = orderData.items.map(item => item.name);
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
    const itemsHtml = orderData.items.map(item => {
      const sizeDescription = productSizeMap[item.name] || item.size;
      return `
                              <tr>
                                <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 14px;">${item.name} (${sizeDescription})</td>
                                <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 14px; text-align: center;">${item.quantity}</td>
                                <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 14px; text-align: right;">$${item.price.toFixed(2)}</td>
                                <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 14px; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
                              </tr>`;
    }).join('');

    // Customer confirmation email (logo-matched colors: #214B95 blue, #039C97 teal)
    const customerEmailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation - Aqua VI</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="display: none; max-height: 0; overflow: hidden;">
    Your Aqua VI order ${orderData.orderNumber} has been received.
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

                <!-- Status Banner - Blue/Teal for Confirmation -->
                <tr>
                  <td style="padding: 0 32px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: linear-gradient(135deg, #214B95 0%, #039C97 100%); border-radius: 16px; margin-top: -1px;">
                      <tr>
                        <td style="padding: 24px 32px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; width: 48px; height: 48px; text-align: center; vertical-align: middle;">
                                <span style="font-size: 24px; color: #ffffff;">✓</span>
                              </td>
                              <td style="padding-left: 16px;">
                                <p style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff;">Order Confirmed!</p>
                                <p style="margin: 4px 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.9);">We've received your order</p>
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
                    <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: #111827;">Thanks, ${orderData.customerName}</h1>
                    <p style="margin: 0; font-size: 16px; color: #6b7280; line-height: 1.5;">We've received your order. We'll contact you shortly to confirm ${isPickup ? 'pickup' : 'delivery'} details.</p>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top: 16px;">
                      <tr>
                        <td>
                          <span style="font-size: 14px; color: #6b7280;">Order # ${orderData.orderNumber}</span>
                        </td>
                        <td style="padding: 0 12px;">
                          <span style="color: #d1d5db;">|</span>
                        </td>
                        <td>
                          <span style="font-size: 14px; font-weight: 600; color: #214B95;">$${orderData.totalAmount.toFixed(2)}</span>
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
                                <div style="width: 24px; height: 24px; background-color: #039C97; border-radius: 50%; text-align: center; line-height: 24px;">
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
                                <div style="width: 24px; height: 24px; background-color: #e5e7eb; border-radius: 50%; text-align: center; line-height: 24px;">
                                  <span style="color: #9ca3af; font-size: 12px;">2</span>
                                </div>
                              </td>
                              <td style="vertical-align: top;">
                                <p style="margin: 0; font-size: 14px; font-weight: 600; color: #9ca3af;">Preparing</p>
                                <p style="margin: 4px 0 0; font-size: 13px; color: #9ca3af;">Packing your items</p>
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
                                <div style="width: 24px; height: 24px; background-color: #e5e7eb; border-radius: 50%; text-align: center; line-height: 24px;">
                                  <span style="color: #9ca3af; font-size: 12px;">3</span>
                                </div>
                              </td>
                              <td style="vertical-align: top;">
                                <p style="margin: 0; font-size: 14px; font-weight: 600; color: #9ca3af;">${isPickup ? 'Ready for pickup' : 'Out for delivery'}</p>
                                <p style="margin: 4px 0 0; font-size: 13px; color: #9ca3af;">Next step after confirmation</p>
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
                    <div style="background-color: #f9fafb; padding: 12px 16px; border-radius: 8px 8px 0 0; border-bottom: 1px solid #e5e7eb;">
                      <h2 style="margin: 0; font-size: 14px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">Order details</h2>
                    </div>
                  </td>
                </tr>

                <!-- Delivery/Pickup Info -->
                <tr>
                  <td style="padding: 0 40px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f9fafb;">
                      <tr>
                        <td style="padding: 16px; width: 50%; vertical-align: top;">
                          <p style="margin: 0 0 4px; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">${isPickup ? 'Pickup Location' : 'Delivery Address'}</p>
                          <p style="margin: 0; font-size: 14px; color: #111827; line-height: 1.4;">${deliveryInfoText}</p>
                        </td>
                        <td style="padding: 16px; width: 50%; vertical-align: top;">
                          <p style="margin: 0 0 4px; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Payment & Type</p>
                          <p style="margin: 0; font-size: 14px; color: #111827;">Method: ${orderData.paymentMethod}</p>
                          <p style="margin: 4px 0 0; font-size: 14px; color: #111827;">Order: ${isPickup ? 'Pickup' : 'Delivery'}</p>
                          ${orderData.customerPhone ? `<p style="margin: 4px 0 0; font-size: 14px; color: #111827;">Phone: ${orderData.customerPhone}</p>` : ''}
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding: 0 16px 16px;">
                          <div style="background-color: #e0f2fe; border-radius: 8px; padding: 12px 16px;">
                            <p style="margin: 0; font-size: 13px; color: #0369a1;">
                              <strong>${isPickup ? 'Pickup info:' : 'Delivery info:'}</strong>
                              ${isPickup
                                ? ' We will contact you shortly to confirm pickup time. Please bring your order confirmation.'
                                : ' Our delivery team will contact you shortly to confirm delivery time. Standard delivery window: 3:30 PM – 5:30 PM.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Items Section Header -->
                <tr>
                  <td style="padding: 24px 40px 0;">
                    <div style="background-color: #f9fafb; padding: 12px 16px; border-radius: 8px 8px 0 0; border-bottom: 1px solid #e5e7eb;">
                      <h2 style="margin: 0; font-size: 14px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">Items</h2>
                    </div>
                  </td>
                </tr>

                <!-- Items Table -->
                <tr>
                  <td style="padding: 0 40px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f9fafb;">
                      <tr>
                        <td style="padding: 0 16px 16px;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
                            <thead>
                              <tr style="background-color: #214B95;">
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
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #214B95; border-radius: 8px;">
                            <tr>
                              <td style="padding: 16px;">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                  <tr>
                                    <td style="font-size: 16px; font-weight: 600; color: #ffffff;">Order total</td>
                                    <td style="text-align: right; font-size: 24px; font-weight: 700; color: #ffffff;">$${orderData.totalAmount.toFixed(2)}</td>
                                  </tr>
                                  <tr>
                                    <td colspan="2" style="padding-top: 8px;">
                                      <p style="margin: 0; font-size: 13px; color: rgba(255, 255, 255, 0.8);">${orderData.paymentMethod ? `Payment method: ${orderData.paymentMethod}` : ''}</p>
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

                <!-- Support Section Header -->
                <tr>
                  <td style="padding: 24px 40px 0;">
                    <div style="background-color: #f9fafb; padding: 12px 16px; border-radius: 8px 8px 0 0; border-bottom: 1px solid #e5e7eb;">
                      <h2 style="margin: 0; font-size: 14px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">Support</h2>
                    </div>
                  </td>
                </tr>

                <!-- Support Info -->
                <tr>
                  <td style="padding: 0 40px 32px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f9fafb; border-radius: 0 0 8px 8px;">
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
                          <p style="margin: 12px 0 0; font-size: 13px; color: #9ca3af;">Keep your order number handy when you contact us.</p>
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

    // Business notification email with ORANGE theme
    const businessEmailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Order Alert - Aqua VI</title>
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

                <!-- Status Banner - ORANGE for Internal Alert -->
                <tr>
                  <td style="padding: 0 32px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: linear-gradient(135deg, #EA580C 0%, #F97316 100%); border-radius: 16px; margin-top: -1px;">
                      <tr>
                        <td style="padding: 24px 32px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; width: 48px; height: 48px; text-align: center; vertical-align: middle;">
                                <span style="font-size: 24px;">🚨</span>
                              </td>
                              <td style="padding-left: 16px;">
                                <p style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff;">NEW ORDER RECEIVED</p>
                                <p style="margin: 4px 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.9);">Action required</p>
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
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FFF7ED; border-radius: 12px; border-left: 4px solid #EA580C;">
                      <tr>
                        <td style="padding: 20px;">
                          <h3 style="margin: 0 0 16px; font-size: 18px; font-weight: 700; color: #9A3412;">Order: ${orderData.orderNumber}</h3>
                          <p style="margin: 0 0 8px; font-size: 14px; color: #374151;"><strong>Customer:</strong> ${orderData.customerName}</p>
                          <p style="margin: 0 0 8px; font-size: 14px; color: #374151;"><strong>Email:</strong> ${orderData.customerEmail || 'Not provided'}</p>
                          ${orderData.customerPhone ? `<p style="margin: 0 0 8px; font-size: 14px; color: #374151;"><strong>Phone:</strong> ${orderData.customerPhone}</p>` : ''}
                          <p style="margin: 0 0 8px; font-size: 14px; color: #374151;"><strong>${isPickup ? 'Pickup Location' : 'Delivery Address'}:</strong> ${deliveryInfoText}</p>
                          <p style="margin: 0 0 8px; font-size: 14px; color: #374151;"><strong>Payment Method:</strong> ${orderData.paymentMethod}</p>
                          <p style="margin: 0 0 8px; font-size: 14px; color: #374151;">
                            <strong>Order Type:</strong> 
                            <span style="background-color: ${isPickup ? '#FEF3C7' : '#DBEAFE'}; padding: 2px 8px; border-radius: 4px; font-weight: bold;">${isPickup ? '📦 PICKUP' : '🚚 DELIVERY'}</span>
                          </p>
                          <p style="margin: 16px 0 0; font-size: 20px; color: #EA580C;"><strong>Total Amount: $${orderData.totalAmount.toFixed(2)}</strong></p>
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

                <!-- Action Button -->
                <tr>
                  <td style="padding: 0 40px 32px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ECFDF5; border-radius: 12px;">
                      <tr>
                        <td style="padding: 24px; text-align: center;">
                          <p style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #166534;">Action Required: Process this order</p>
                          <a href="${adminDashboardUrl}" style="display: inline-block; background-color: #EA580C; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Process Order</a>
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

    // Send customer confirmation email only if email provided
    if (orderData.customerEmail) {
      try {
        customerEmailResponse = await transporter.sendMail({
          from: '"Aqua VI Distributor" <aquavidistributor@gmail.com>',
          to: orderData.customerEmail,
          subject: `Order Confirmation - ${orderData.orderNumber}`,
          html: customerEmailHtml,
        });
        console.log("Customer email sent:", customerEmailResponse.messageId);
      } catch (emailError) {
        console.error("Error sending customer email:", emailError);
      }
    }

    // Send business notification email (always send for ALL order types)
    try {
      businessEmailResponse = await transporter.sendMail({
        from: '"Aqua VI Distributor" <aquavidistributor@gmail.com>',
        to: "aquavidistributor@gmail.com",
        subject: `🚨 New ${isPickup ? 'Pickup' : 'Delivery'} Order: ${orderData.orderNumber} - $${orderData.totalAmount.toFixed(2)}`,
        html: businessEmailHtml,
      });
      console.log("Business email sent:", businessEmailResponse.messageId);
    } catch (emailError) {
      console.error("Error sending business email:", emailError);
    }

    // SECURITY: Mark confirmation as sent to prevent duplicate emails
    const { error: updateError } = await supabase
      .from('orders')
      .update({ confirmation_sent_at: new Date().toISOString() })
      .eq('order_number', orderData.orderNumber);
    
    if (updateError) {
      console.error("Error marking confirmation as sent:", updateError);
      // Continue anyway - email was sent successfully
    } else {
      console.log("Confirmation marked as sent for order:", orderData.orderNumber);
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
    console.error("Error in send-order-confirmation function:", error);
    // Return generic error to client, log detailed error server-side
    return new Response(
      JSON.stringify({ error: "Unable to send confirmation emails. Please try again later." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
