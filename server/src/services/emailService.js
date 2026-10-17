import nodemailer from 'nodemailer'
import { escapeHtml } from '../utils/sanitize.js'

const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    console.warn('Email credentials not configured. Emails will not be sent.')
    return null
  }

  try {
    return nodemailer.createTransporter({
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
    return `${escapeHtml(address.street)}, ${escapeHtml(address.city)}, ${escapeHtml(address.state)} - ${escapeHtml(address.pincode)}`
  }
  return `${escapeHtml(customer?.address)}, ${escapeHtml(customer?.city)}, ${escapeHtml(customer?.state)} - ${escapeHtml(customer?.pincode)}`
}

export const sendOrderConfirmationEmail = async (orderData, settings = {}) => {
  try {
    const transporter = createTransporter()

    if (!transporter) {
      return { success: false, error: 'Email not configured' }
    }

    const { customer, orderNumber, items, pricing } = orderData
    const fromEmail = process.env.EMAIL_USER
    const brandName = settings.brandName || 'Healthy Oats'

    const itemsRows = items
      .map(
        (item) => `
          <tr>
            <td style="padding: 12px 8px; border-bottom: 1px solid #e5e5e5; color: #374151;">
              ${escapeHtml(item.name)} <span style="color: #6b7280;">× ${escapeHtml(item.quantity)}</span>
            </td>
            <td style="padding: 12px 8px; border-bottom: 1px solid #e5e5e5; text-align: right; color: #374151; font-weight: 500;">
              ₹${escapeHtml(item.subtotal ?? ((item.unitPrice || item.basePrice) * item.quantity))}
            </td>
          </tr>
        `
      )
      .join('')

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            
            <div style="background: linear-gradient(135deg, #2d5f3f 0%, #1e4a2f 100%); color: white; padding: 32px 24px; text-align: center;">
              <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 600;">Order Confirmed</h1>
              <p style="margin: 0; font-size: 16px; opacity: 0.95;">Thank you for your order!</p>
            </div>
            
            <div style="padding: 32px 24px;">
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151;">Hi ${escapeHtml(customer.fullName)},</p>
              
              <div style="background: #f3f4f6; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
                <p style="margin: 0 0 4px 0; font-size: 14px; color: #6b7280;">Order Number</p>
                <p style="margin: 0; font-size: 18px; font-weight: 600; color: #2d5f3f;">${escapeHtml(orderNumber)}</p>
              </div>

              <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
                <tbody>${itemsRows}</tbody>
              </table>

              <div style="border-top: 2px solid #e5e5e5; padding-top: 16px; margin-top: 8px;">
                <table style="width: 100%; font-size: 14px; color: #374151;">
                  <tr>
                    <td style="padding: 6px 0;">Subtotal</td>
                    <td style="text-align: right;">₹${escapeHtml(pricing.subtotal)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0;">Delivery</td>
                    <td style="text-align: right; color: ${pricing.deliveryCharge === 0 ? '#059669' : '#374151'}; font-weight: ${pricing.deliveryCharge === 0 ? '600' : '400'};">
                      ${pricing.deliveryCharge === 0 ? 'FREE' : `₹${escapeHtml(pricing.deliveryCharge)}`}
                    </td>
                  </tr>
                  <tr style="font-size: 18px; font-weight: 600;">
                    <td style="padding: 12px 0 0 0; border-top: 1px solid #e5e5e5;">Total</td>
                    <td style="text-align: right; padding: 12px 0 0 0; border-top: 1px solid #e5e5e5; color: #2d5f3f;">₹${escapeHtml(pricing.total)}</td>
                  </tr>
                </table>
              </div>

              <div style="background: #f9fafb; padding: 16px; border-radius: 6px; margin-top: 24px;">
                <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #374151;">Delivery Address</p>
                <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
                  ${escapeHtml(customer.fullName)}<br>
                  ${formatAddress(customer)}<br>
                  ${escapeHtml(customer.phone)}
                </p>
              </div>
            </div>

            <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0; font-size: 13px; color: #6b7280;">Thank you for choosing ${escapeHtml(brandName)}</p>
            </div>
          </div>
        </body>
      </html>
    `

    await transporter.sendMail({
      from: `"${brandName}" <${fromEmail}>`,
      to: customer.email,
      subject: `Order Confirmed – #${orderNumber}`,
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

    const itemsRows = items
      .map((item) => `
        <tr>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e5e5e5; color: #374151;">
            ${escapeHtml(item.name)} × ${escapeHtml(item.quantity)}
          </td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e5e5e5; text-align: right; color: #374151;">
            ₹${escapeHtml(item.subtotal ?? item.basePrice * item.quantity)}
          </td>
        </tr>
      `)
      .join('')

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            
            <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: white; padding: 24px; text-align: center;">
              <h1 style="margin: 0 0 4px 0; font-size: 24px; font-weight: 600;">New Order</h1>
              <p style="margin: 0; font-size: 18px; opacity: 0.95;">#${escapeHtml(orderNumber)}</p>
            </div>
            
            <div style="padding: 24px;">
              <div style="margin-bottom: 20px;">
                <table style="width: 100%; font-size: 14px; color: #374151;">
                  <tr>
                    <td style="padding: 6px 0; font-weight: 600; width: 140px;">Customer</td>
                    <td style="padding: 6px 0;">${escapeHtml(customer.fullName)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: 600;">Phone</td>
                    <td style="padding: 6px 0;">${escapeHtml(customer.phone)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: 600;">Email</td>
                    <td style="padding: 6px 0;">${escapeHtml(customer.email)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: 600;">Address</td>
                    <td style="padding: 6px 0;">${formatAddress(customer)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: 600;">Payment</td>
                    <td style="padding: 6px 0;">${escapeHtml(String(payment.method || '').toUpperCase())}</td>
                  </tr>
                </table>
              </div>

              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tbody>${itemsRows}</tbody>
              </table>

              <div style="text-align: right; padding-top: 12px; border-top: 2px solid #e5e5e5;">
                <p style="margin: 0; font-size: 18px; font-weight: 600; color: #2d5f3f;">Total: ₹${escapeHtml(pricing.total)}</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    await transporter.sendMail({
      from: `"${brandName} Orders" <${fromEmail}>`,
      to: adminEmail,
      subject: `New Order #${orderNumber}`,
      html: emailHtml,
    })

    return { success: true }
  } catch (error) {
    console.error('Admin email error:', error)
    return { success: false, error: error.message }
  }
}
