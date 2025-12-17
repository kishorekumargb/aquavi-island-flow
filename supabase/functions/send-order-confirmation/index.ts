import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const orderData: OrderConfirmationRequest = await req.json();
    
    console.log("Processing order confirmation emails for order:", orderData.orderNumber);

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
      .select('order_number, customer_email, total_amount')
      .eq('order_number', orderData.orderNumber)
      .single();
    
    if (orderError || !order) {
      console.error("Order not found:", orderData.orderNumber);
      return new Response(
        JSON.stringify({ error: "Invalid order" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
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

    // Generate order items HTML
    const itemsHtml = orderData.items.map(item => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 12px; text-align: left;">${item.name} (${item.size})</td>
        <td style="padding: 12px; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; text-align: right;">$${item.price.toFixed(2)}</td>
        <td style="padding: 12px; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    // Customer confirmation email
    const customerEmailHtml = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Aqua VI</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Premium Water Delivery</p>
          </div>
          
          <h2 style="color: #333; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">Order Confirmation</h2>
          
          <p>Dear ${orderData.customerName},</p>
          <p>Thank you for your order! We have received your order and will process it shortly.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #333;">Order Details</h3>
            <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
            <p><strong>Delivery Address:</strong> ${orderData.deliveryAddress}</p>
            <p><strong>Payment Method:</strong> ${orderData.paymentMethod}</p>
            <p><strong>Delivery Type:</strong> ${orderData.deliveryType}</p>
            ${orderData.customerPhone ? `<p><strong>Phone:</strong> ${orderData.customerPhone}</p>` : ''}
          </div>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: white; border: 1px solid #ddd;">
            <thead>
              <tr style="background-color: #2563eb; color: white;">
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
                <td style="padding: 12px; text-align: right; color: #2563eb;">$${orderData.totalAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div style="background-color: #e7f3ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #1e40af;"><strong>Delivery Information:</strong></p>
            <p style="margin: 5px 0 0 0;">Our delivery team will contact you shortly to confirm the delivery time. Standard delivery is between 3:30 PM - 5:30 PM.</p>
          </div>

          <p>If you have any questions about your order, please contact us at:</p>
          <ul>
            <li>Phone: 1-499-4611</li>
            <li>Email: aquadistributor@gmail.com</li>
          </ul>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666;">
            <p>Thank you for choosing Aqua VI!</p>
            <p style="font-size: 12px;">This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </div>
    `;

    // Business notification email
    const businessEmailHtml = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #dc2626; margin: 0 0 20px 0; font-size: 24px;">🚨 New Order Received!</h1>
          
          <div style="background-color: #fef2f2; padding: 20px; border-left: 4px solid #dc2626; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #dc2626;">Order: ${orderData.orderNumber}</h3>
            <p><strong>Customer:</strong> ${orderData.customerName}</p>
            <p><strong>Email:</strong> ${orderData.customerEmail || 'Not provided'}</p>
            ${orderData.customerPhone ? `<p><strong>Phone:</strong> ${orderData.customerPhone}</p>` : ''}
            <p><strong>Delivery Address:</strong> ${orderData.deliveryAddress}</p>
            <p><strong>Payment Method:</strong> ${orderData.paymentMethod}</p>
            <p><strong>Delivery Type:</strong> ${orderData.deliveryType}</p>
            <p><strong>Total Amount:</strong> <span style="color: #dc2626; font-weight: bold;">$${orderData.totalAmount.toFixed(2)}</span></p>
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

          <div style="text-align: center; margin-top: 20px; padding: 15px; background-color: #f0fdf4; border-radius: 6px;">
            <p style="margin: 0; color: #15803d; font-weight: bold;">Action Required: Process this order in the admin dashboard</p>
          </div>
        </div>
      </div>
    `;

    let customerEmailResponse = null;
    let businessEmailResponse = null;

    // Send customer confirmation email only if email provided
    if (orderData.customerEmail) {
      customerEmailResponse = await resend.emails.send({
        from: "Aqua VI <onboarding@resend.dev>",
        replyTo: "aquadistributor@gmail.com",
        to: [orderData.customerEmail],
        subject: `Order Confirmation - ${orderData.orderNumber}`,
        html: customerEmailHtml,
      });
      console.log("Customer email sent:", customerEmailResponse);
    }

    // Send business notification email
    businessEmailResponse = await resend.emails.send({
      from: "Aqua VI Orders <onboarding@resend.dev>",
      replyTo: "aquadistributor@gmail.com",
      to: ["aquavidistributor@gmail.com"],
      subject: `🚨 New Order: ${orderData.orderNumber} - $${orderData.totalAmount.toFixed(2)}`,
      html: businessEmailHtml,
    });

    console.log("Business email sent:", businessEmailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        customerEmail: customerEmailResponse,
        businessEmail: businessEmailResponse,
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
