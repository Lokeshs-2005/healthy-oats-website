import { createTransport } from 'nodemailer'
import { escapeHtml } from '../utils/sanitize.js'

const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    console.warn('Email credentials not configured. Emails will not be sent.')
    return null
  }

  try {
    const transporter = createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    })
    return transporter
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
    console.log('[EMAIL] Attempting to send customer confirmation email...')
    const transporter = createTransporter()

    if (!transporter) {
      console.log('[EMAIL] Transporter creation failed - email not configured')
      return { success: false, error: 'Email not configured' }
    }

    const { customer, orderNumber, items, pricing } = orderData
    const fromEmail = process.env.EMAIL_USER
    const brandName = settings.brandName || 'Healthy Oats'
    
    console.log(`[EMAIL] Sending to customer: ${customer.email}`)

    const itemsRows = items
      .map(
        (item) => `
          <tr>
            <td style="padding: 12px 8px; border-bottom: 1px solid #e5e5e5; color: #374151;">
              ${escapeHtml(item.name)}${item.selectedQuantity ? ` (${escapeHtml(item.selectedQuantity)})` : ''} <span style="color: #6b7280;">× ${escapeHtml(item.quantity)}</span>
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
                <table style="width: 100%; font-size: 16px; color: #374151;">
                  <tr style="font-size: 18px; font-weight: 600;">
                    <td style="padding: 12px 0;">Total</td>
                    <td style="text-align: right; color: #2d5f3f;">₹${escapeHtml(pricing.total)}</td>
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

    console.log(`[EMAIL] ✓ Customer email sent successfully to ${customer.email}`)
    return { success: true }
  } catch (error) {
    console.error('[EMAIL] ✗ Customer email error:', error.message)
    console.error('[EMAIL] Full error:', error)
    return { success: false, error: error.message }
  }
}

export const sendAdminOrderNotification = async (orderData, settings = {}) => {
  try {
    console.log('[EMAIL] Attempting to send admin notification email...')
    const transporter = createTransporter()

    if (!transporter) {
      console.log('[EMAIL] Transporter creation failed - email not configured')
      return { success: false, error: 'Email not configured' }
    }

    const { customer, orderNumber, items, pricing, payment } = orderData
    const fromEmail = process.env.EMAIL_USER
    const brandName = settings.brandName || 'Healthy Oats'
    
    // Send to the configured admin email
    const adminEmail = process.env.EMAIL_USER
    
    // Generate Google Maps link if location is shared
    const mapsLink = customer.latitude && customer.longitude
      ? `https://www.google.com/maps?q=${customer.latitude},${customer.longitude}`
      : null
    
    console.log(`[EMAIL] Sending to admin: ${adminEmail}`)
    if (mapsLink) {
      console.log(`[EMAIL] Location shared - Maps link included`)
    }

    const itemsRows = items
      .map((item) => `
        <tr>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e5e5e5; color: #374151;">
            ${escapeHtml(item.name)}${item.selectedQuantity ? ` (${escapeHtml(item.selectedQuantity)})` : ''} × ${escapeHtml(item.quantity)}
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
                  ${mapsLink ? `
                  <tr>
                    <td style="padding: 6px 0; font-weight: 600;">📍 Location</td>
                    <td style="padding: 6px 0;">
                      <a href="${mapsLink}" target="_blank" style="color: #2563eb; text-decoration: none; background: #eff6ff; padding: 4px 12px; border-radius: 4px; display: inline-block; font-weight: 500;">
                        View on Google Maps →
                      </a>
                    </td>
                  </tr>
                  ` : ''}
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

    console.log(`[EMAIL] ✓ Admin email sent successfully to ${adminEmail}`)
    return { success: true }
  } catch (error) {
    console.error('[EMAIL] ✗ Admin email error:', error.message)
    console.error('[EMAIL] Full error:', error)
    return { success: false, error: error.message }
  }
}
