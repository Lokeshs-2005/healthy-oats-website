import nodemailer from 'nodemailer'
import { escapeHtml } from '../utils/sanitize.js'

const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    console.warn('Email credentials not configured. Emails will not be sent.')
    return null
  }

  try {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    })
  } catch (error) {
    console.error('Failed to create email transporter:', error)
    return null
  }
}

const formatAddress = (customer) => {
  const address = customer?.address
  if (address && typeof address === 'object') {
    return `${escapeHtml(address.street)}<br>${escapeHtml(address.city)}, ${escapeHtml(address.state)} - ${escapeHtml(address.pincode)}`
  }
  return `${escapeHtml(customer?.address)}<br>${escapeHtml(customer?.city)}, ${escapeHtml(customer?.state)} - ${escapeHtml(customer?.pincode)}`
}

export const sendOrderConfirmationEmail = async (orderData, settings = {}) => {
  try {
    const transporter = createTransporter()

    if (!transporter) {
      return { success: false, error: 'Email not configured' }
    }

    const { customer, orderNumber, items, pricing, payment } = orderData
    const fromEmail = process.env.EMAIL_USER
    const supportPhone = settings.businessPhone || ''
    const supportEmail = settings.businessEmail || fromEmail
    const brandName = settings.brandName || 'Healthy Oats'

    const itemsHtml = items
      .map(
        (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          ${escapeHtml(item.name)} x ${escapeHtml(item.quantity)}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
          ₹${escapeHtml(item.subtotal ?? ((item.unitPrice || item.basePrice) * item.quantity))}
        </td>
      </tr>
    `
      )
      .join('')

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #2d5f3f; color: white; padding: 20px; text-align: center;">
              <h1>Order Confirmation</h1>
              <p>Thank you for your order!</p>
            </div>
            <div style="background: #f9f9f9; padding: 30px;">
              <h2>Hi ${escapeHtml(customer.fullName)},</h2>
              <p>Your order has been successfully placed and is being processed.</p>
              <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <p><strong>Order Number:</strong> ${escapeHtml(orderNumber)}</p>
                <p><strong>Payment Method:</strong> ${payment.method === 'cod' ? 'Cash on Delivery' : 'UPI'}</p>
                <p><strong>Payment Status:</strong> ${
                  payment.status === 'pending_verification' ? 'Pending Verification' : 'Pending'
                }</p>
                <table style="width: 100%; border-collapse: collapse;">
                  <tbody>${itemsHtml}</tbody>
                </table>
                <p>Subtotal: ₹${escapeHtml(pricing.subtotal)}</p>
                <p>Delivery Charge: ${pricing.deliveryCharge === 0 ? 'FREE' : `₹${escapeHtml(pricing.deliveryCharge)}`}</p>
                <p><strong>Total: ₹${escapeHtml(pricing.total)}</strong></p>
                <h4>Delivery Address</h4>
                <p>${escapeHtml(customer.fullName)}<br>${formatAddress(customer)}<br>Phone: ${escapeHtml(customer.phone)}</p>
              </div>
              ${
                payment.method === 'upi' && payment.status === 'pending_verification'
                  ? '<p>Your UPI payment is being verified. We will update you once it is confirmed.</p>'
                  : ''
              }
              <p>
                Need help?<br>
                ${supportPhone ? `Phone: ${escapeHtml(supportPhone)}<br>` : ''}
                ${supportEmail ? `Email: ${escapeHtml(supportEmail)}` : ''}
              </p>
            </div>
            <p style="text-align: center; color: #666;">Thank you for choosing ${escapeHtml(brandName)}.</p>
          </div>
        </body>
      </html>
    `

    await transporter.sendMail({
      from: `"${brandName}" <${fromEmail}>`,
      to: customer.email,
      subject: `Order Confirmation - ${orderNumber}`,
      html: emailHtml,
    })

    return { success: true }
  } catch (error) {
    console.error('Email sending error:', error)
    return { success: false, error: error.message }
  }
}

export const sendAdminOrderNotification = async (orderData, settings = {}) => {
  try {
    const transporter = createTransporter()

    if (!transporter) {
      return { success: false, error: 'Email not configured' }
    }

    const { customer, orderNumber, items, pricing, payment } = orderData
    const fromEmail = process.env.EMAIL_USER
    const adminEmail = settings.businessEmail || fromEmail
    const brandName = settings.brandName || 'Healthy Oats'

    const itemsList = items
      .map((item) => `- ${item.name} x ${item.quantity} = ₹${item.subtotal ?? item.basePrice * item.quantity}`)
      .join('\n')

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #244C3A; color: white; padding: 20px; text-align: center;">
              <h1>New Order Received</h1>
              <p>Order #${escapeHtml(orderNumber)}</p>
            </div>
            <div style="background: #f9f9f9; padding: 30px;">
              <p><strong>Payment Method:</strong> ${escapeHtml(String(payment.method || '').toUpperCase())}</p>
              <p><strong>Payment Status:</strong> ${escapeHtml(payment.status)}</p>
              <p><strong>Total Amount:</strong> ₹${escapeHtml(pricing.total)}</p>
              <p>
                <strong>Name:</strong> ${escapeHtml(customer.fullName)}<br>
                <strong>Phone:</strong> ${escapeHtml(customer.phone)}<br>
                <strong>Email:</strong> ${escapeHtml(customer.email)}
              </p>
              <p>${formatAddress(customer)}</p>
              <pre style="background: #f5f5f5; padding: 15px; white-space: pre-wrap;">${escapeHtml(itemsList)}</pre>
              ${
                payment.method === 'upi' && payment.status === 'pending_verification'
                  ? '<p><strong>Action required:</strong> Verify the UPI payment, then update payment status in the admin panel.</p>'
                  : ''
              }
            </div>
          </div>
        </body>
      </html>
    `

    await transporter.sendMail({
      from: `"${brandName} Orders" <${fromEmail}>`,
      to: adminEmail,
      subject: `New Order: ${orderNumber} - ₹${pricing.total}`,
      html: emailHtml,
    })

    return { success: true }
  } catch (error) {
    console.error('Admin email error:', error)
    return { success: false, error: error.message }
  }
}
