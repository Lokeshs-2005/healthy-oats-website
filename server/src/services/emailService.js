import nodemailer from 'nodemailer'

// Email configuration
const createTransporter = () => {
  // Check if credentials are available
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    console.warn('⚠️  Email credentials not configured. Emails will not be sent.')
    return null
  }

  try {
    // Using Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
      }
    })

    console.log('✓ Email transporter configured successfully')
    return transporter
  } catch (error) {
    console.error('❌ Failed to create email transporter:', error)
    return null
  }
}

// Send order confirmation email to customer
export const sendOrderConfirmationEmail = async (orderData) => {
  try {
    const transporter = createTransporter()
    
    if (!transporter) {
      console.log('⚠️  Skipping customer email - transporter not available')
      return { success: false, error: 'Email not configured' }
    }

    const { customer, orderNumber, items, pricing, payment } = orderData

    // Build items list HTML
    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          ${item.name} x ${item.quantity}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
          ₹${item.basePrice * item.quantity}
        </td>
      </tr>
    `).join('')

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2d5f3f; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; }
            .order-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .total { font-size: 1.2em; font-weight: bold; color: #2d5f3f; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
            table { width: 100%; border-collapse: collapse; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Order Confirmation</h1>
              <p>Thank you for your order!</p>
            </div>
            
            <div class="content">
              <h2>Hi ${customer.fullName},</h2>
              <p>Your order has been successfully placed and is being processed.</p>
              
              <div class="order-details">
                <h3>Order Details</h3>
                <p><strong>Order Number:</strong> ${orderNumber}</p>
                <p><strong>Payment Method:</strong> ${payment.method === 'cod' ? 'Cash on Delivery' : 'UPI'}</p>
                <p><strong>Payment Status:</strong> ${payment.status === 'pending_verification' ? 'Pending Verification' : 'Pending'}</p>
                
                <h4 style="margin-top: 20px;">Items Ordered:</h4>
                <table>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                </table>
                
                <table style="margin-top: 20px;">
                  <tr>
                    <td style="padding: 5px;">Subtotal:</td>
                    <td style="padding: 5px; text-align: right;">₹${pricing.subtotal}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px;">Delivery Charge:</td>
                    <td style="padding: 5px; text-align: right;">
                      ${pricing.deliveryCharge === 0 ? 'FREE' : `₹${pricing.deliveryCharge}`}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; border-top: 2px solid #2d5f3f;" class="total">Total:</td>
                    <td style="padding: 10px; border-top: 2px solid #2d5f3f; text-align: right;" class="total">₹${pricing.total}</td>
                  </tr>
                </table>
                
                <h4 style="margin-top: 20px;">Delivery Address:</h4>
                <p>
                  ${customer.address}<br>
                  ${customer.city}, ${customer.state} - ${customer.pincode}<br>
                  Phone: ${customer.phone}
                </p>
              </div>
              
              ${payment.method === 'upi' && payment.status === 'pending_verification' ? `
                <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
                  <strong>⚠️ Payment Verification Pending</strong>
                  <p>Your UPI payment is being verified. We'll update you once confirmed.</p>
                </div>
              ` : ''}
              
              <p style="margin-top: 20px;">
                We'll notify you once your order is confirmed and ready for delivery.
              </p>
              
              <p>
                <strong>Need help?</strong> Contact us at:<br>
                📞 +91 70265 63874<br>
                📧 healthyoatsgg@gmail.com
              </p>
            </div>
            
            <div class="footer">
              <p>Thank you for choosing Healthy Oats!</p>
              <p>Fresh, Healthy, Delicious 🥣</p>
            </div>
          </div>
        </body>
      </html>
    `

    const mailOptions = {
      from: '"Healthy Oats" <healthyoatsgg@gmail.com>',
      to: customer.email,
      subject: `Order Confirmation - ${orderNumber}`,
      html: emailHtml
    }

    await transporter.sendMail(mailOptions)
    console.log(`✓ Order confirmation email sent to ${customer.email}`)
    return { success: true }
  } catch (error) {
    console.error('Email sending error:', error)
    // Don't throw - email is not critical, order should still be placed
    return { success: false, error: error.message }
  }
}

// Send order notification to admin
export const sendAdminOrderNotification = async (orderData) => {
  try {
    const transporter = createTransporter()
    
    if (!transporter) {
      console.log('⚠️  Skipping admin email - transporter not available')
      return { success: false, error: 'Email not configured' }
    }

    const { customer, orderNumber, items, pricing, payment } = orderData

    const itemsList = items.map(item => 
      `- ${item.name} x ${item.quantity} = ₹${item.basePrice * item.quantity}`
    ).join('\n')

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; }
            .order-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .urgent { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 New Order Received!</h1>
              <p>Order #${orderNumber}</p>
            </div>
            
            <div class="content">
              <div class="order-details">
                <h3>Order Information</h3>
                <p><strong>Order Number:</strong> ${orderNumber}</p>
                <p><strong>Payment Method:</strong> ${payment.method.toUpperCase()}</p>
                <p><strong>Payment Status:</strong> ${payment.status}</p>
                <p><strong>Total Amount:</strong> ₹${pricing.total}</p>
                
                <h4 style="margin-top: 20px;">Customer Details:</h4>
                <p>
                  <strong>Name:</strong> ${customer.fullName}<br>
                  <strong>Phone:</strong> ${customer.phone}<br>
                  <strong>Email:</strong> ${customer.email}
                </p>
                
                <p>
                  <strong>Address:</strong><br>
                  ${customer.address}<br>
                  ${customer.city}, ${customer.state} - ${customer.pincode}
                </p>
                
                <h4 style="margin-top: 20px;">Items:</h4>
                <pre style="background: #f5f5f5; padding: 15px; border-radius: 4px;">${itemsList}</pre>
                
                <p style="margin-top: 15px;">
                  <strong>Subtotal:</strong> ₹${pricing.subtotal}<br>
                  <strong>Delivery:</strong> ${pricing.deliveryCharge === 0 ? 'FREE' : `₹${pricing.deliveryCharge}`}<br>
                  <strong>Total:</strong> ₹${pricing.total}
                </p>
              </div>
              
              ${payment.method === 'upi' && payment.status === 'pending_verification' ? `
                <div class="urgent">
                  <strong>⚠️ Action Required: UPI Payment Verification</strong>
                  <p>Please check your bank account and verify the payment.</p>
                </div>
              ` : ''}
              
              <p style="margin-top: 20px;">
                <strong>Next Steps:</strong><br>
                1. Confirm the order in admin panel<br>
                ${payment.method === 'upi' ? '2. Verify payment in bank account<br>3. Update payment status<br>4. Prepare the order' : '2. Prepare the order for delivery'}
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    const mailOptions = {
      from: '"Healthy Oats System" <healthyoatsgg@gmail.com>',
      to: 'healthyoatsgg@gmail.com', // Admin email
      subject: `🔔 New Order: ${orderNumber} - ₹${pricing.total}`,
      html: emailHtml
    }

    await transporter.sendMail(mailOptions)
    console.log('✓ Admin notification email sent')
    return { success: true }
  } catch (error) {
    console.error('Admin email error:', error)
    return { success: false, error: error.message }
  }
}
