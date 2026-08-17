/**
 * email.ts — Email notification service with pluggable providers
 *
 * EMAIL_PROVIDER unset  -> console (logs the email, no send — dev default)
 * EMAIL_PROVIDER=smtp   -> nodemailer via SMTP_HOST/PORT/USER/PASS/FROM
 * EMAIL_PROVIDER=resend -> Resend API via RESEND_API_KEY/EMAIL_FROM
 */

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

async function sendViaConsole({ to, subject, html }: SendEmailInput) {
  console.log(`[Email:console] To: ${to} | Subject: ${subject}\n${html}`);
}

async function sendViaSmtp({ to, subject, html }: SendEmailInput) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
  });
}

async function sendViaResend({ to, subject, html }: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[Email:resend] RESEND_API_KEY not set, falling back to console log');
    return sendViaConsole({ to, subject, html });
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'SocioPath <onboarding@resend.dev>',
      to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    console.error('[Email:resend] Send failed:', await res.text());
  }
}

async function sendEmail(input: SendEmailInput): Promise<void> {
  const provider = process.env.EMAIL_PROVIDER;
  try {
    if (provider === 'smtp') {
      await sendViaSmtp(input);
    } else if (provider === 'resend') {
      await sendViaResend(input);
    } else {
      await sendViaConsole(input);
    }
  } catch (err) {
    // Email failures must never block a booking confirmation — log and move on.
    console.error('[Email] Failed to send:', err);
  }
}

export async function sendBookingConfirmation(
  to: string,
  data: {
    userName?: string | null;
    eventTitle: string;
    eventDate: string;
    venue?: string;
    quantity: number;
    finalAmount: number;
    taxes: number;
    ticketNumber: string;
    bookingId: string;
  }
) {
  const subject = `Booking Confirmed — ${data.eventTitle}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Booking Confirmed 🎉</h2>
      <p>Hi ${data.userName || 'there'}, your ticket${data.quantity > 1 ? 's are' : ' is'} confirmed for:</p>
      <h3>${data.eventTitle}</h3>
      <p><strong>Date:</strong> ${data.eventDate}</p>
      ${data.venue ? `<p><strong>Venue:</strong> ${data.venue}</p>` : ''}
      <p><strong>Tickets:</strong> ${data.quantity}</p>
      <p><strong>Total Paid:</strong> ₹${data.finalAmount.toLocaleString('en-IN')} (incl. ₹${data.taxes.toLocaleString('en-IN')} taxes)</p>
      <p><strong>Ticket Number:</strong> ${data.ticketNumber}</p>
      <p style="color: #888; font-size: 0.85rem;">Booking ID: ${data.bookingId}</p>
      <p>Show your QR ticket at entry. See you there!</p>
    </div>
  `;

  await sendEmail({ to, subject, html });
}

export async function sendCancellationEmail(
  to: string,
  data: {
    userName?: string | null;
    eventTitle: string;
    eventDate: string;
    ticketNumber: string;
    refundAmount: number;
    refundPercent: number;
  }
) {
  const subject = `Booking Cancelled — ${data.eventTitle}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Booking Cancelled</h2>
      <p>Hi ${data.userName || 'there'}, your booking for <strong>${data.eventTitle}</strong> on ${data.eventDate} has been cancelled.</p>
      <p><strong>Refund:</strong> ₹${data.refundAmount.toLocaleString('en-IN')} (${data.refundPercent}%) is being processed to your original payment method.</p>
      <p style="color: #888; font-size: 0.85rem;">Reference: ${data.ticketNumber}</p>
    </div>
  `;

  await sendEmail({ to, subject, html });
}
