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

    // Use service role for admin check and data access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is admin
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      console.error("User is not an admin:", user.id);
      return new Response(
        JSON.stringify({ error: "Forbidden: Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Admin verified, processing delivery confirmation");

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
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 12px; text-align: left;">${item.name}</td>
        <td style="padding: 12px; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; text-align: right;">$${Number(item.price).toFixed(2)}</td>
        <td style="padding: 12px; text-align: right;">$${(Number(item.price) * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    // Customer delivery confirmation email
    const customerEmailHtml = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="${logoUrl}" alt="Aqua VI Logo" style="max-width: 180px; height: auto; margin-bottom: 15px;" />
            <p style="color: #666; margin: 5px 0 0 0;">Premium Water Delivery</p>
          </div>
          
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background-color: #10b981; color: white; padding: 15px 30px; border-radius: 50px; display: inline-block;">
              <span style="font-size: 24px; margin-right: 10px;">✅</span>
              <span style="font-size: 20px; font-weight: bold;">${isPickup ? 'Order Picked Up!' : 'Order Delivered!'}</span>
            </div>
          </div>
          
          <h2 style="color: #333; border-bottom: 2px solid #10b981; padding-bottom: 10px;">Delivery Confirmation</h2>
          
          <p>Dear ${order.customer_name},</p>
          <p>Great news! Your order has been successfully ${isPickup ? 'picked up' : 'delivered'}. We hope you enjoy your Aqua VI premium water!</p>
          
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h3 style="margin: 0 0 15px 0; color: #166534;">Order Summary</h3>
            <p><strong>Order Number:</strong> ${order.order_number}</p>
            <p><strong>${isPickup ? 'Pickup Location' : 'Delivered To'}:</strong> ${deliveryInfoText}</p>
            <p><strong>Order Type:</strong> ${isPickup ? 'Pickup' : 'Delivery'}</p>
            <p><strong>Payment Method:</strong> ${order.payment_method || 'Cash'}</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: white; border: 1px solid #ddd;">
            <thead>
              <tr style="background-color: #10b981; color: white;">
                <th style="padding: 12px; text-align: left;">Item</th>
                <th style="padding: 12px; text-align: center;">Quantity</th>
                <th style="padding: 12px; text-align: right;">Price</th>
                <th style="padding: 12px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              <tr style="background-color: #f8f9fa; font-weight: bold;">
                <td colspan="3" style="padding: 12px; text-align: right;">Total Amount:</td>
                <td style="padding: 12px; text-align: right; color: #10b981;">$${Number(order.total_amount).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e;"><strong>💧 Thank you for choosing Aqua VI!</strong></p>
            <p style="margin: 5px 0 0 0;">We appreciate your business and look forward to serving you again.</p>
          </div>

          <p>If you have any feedback or questions, please contact us at:</p>
          <ul>
            <li>Phone: 1-499-4611</li>
            <li>Email: aquavidistributor@gmail.com</li>
          </ul>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666;">
            <p>Thank you for choosing Aqua VI!</p>
            <p style="font-size: 12px;">This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </div>
    `;

    // Business notification email for completed delivery
    const businessEmailHtml = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${logoUrl}" alt="Aqua VI Logo" style="max-width: 150px; height: auto;" />
          </div>
          
          <div style="text-align: center; margin-bottom: 20px;">
            <span style="background-color: #10b981; color: white; padding: 10px 25px; border-radius: 50px; font-size: 18px; font-weight: bold;">
              ✅ Order ${isPickup ? 'Picked Up' : 'Delivered'}
            </span>
          </div>
          
          <div style="background-color: #f0fdf4; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #166534;">Order: ${order.order_number}</h3>
            <p><strong>Customer:</strong> ${order.customer_name}</p>
            <p><strong>Email:</strong> ${order.customer_email || 'Not provided'}</p>
            ${order.customer_phone ? `<p><strong>Phone:</strong> ${order.customer_phone}</p>` : ''}
            <p><strong>${isPickup ? 'Pickup' : 'Delivery'} Completed:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Order Type:</strong> ${isPickup ? '📦 PICKUP' : '🚚 DELIVERY'}</p>
            <p><strong>Total Amount:</strong> <span style="color: #10b981; font-weight: bold;">$${Number(order.total_amount).toFixed(2)}</span></p>
          </div>

          <h3 style="color: #333; margin: 20px 0 10px 0;">Order Items:</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Item</th>
                <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Qty</th>
                <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Price</th>
                <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="text-align: center; margin-top: 30px; padding: 15px; background-color: #f0fdf4; border-radius: 6px;">
            <p style="margin: 0; color: #166534;">Order completed successfully! 🎉</p>
          </div>
        </div>
      </div>
    `;

    let customerEmailResponse = null;
    let businessEmailResponse = null;

    // Send customer delivery confirmation email only if email provided
    if (order.customer_email) {
      try {
        customerEmailResponse = await transporter.sendMail({
          from: '"Aqua VI" <aquavidistributor@gmail.com>',
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
        from: '"Aqua VI Orders" <aquavidistributor@gmail.com>',
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
