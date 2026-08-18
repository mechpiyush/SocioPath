/**
 * otp.ts — SMS OTP service with pluggable providers
 *
 * OTP_PROVIDER unset  -> console (logs the OTP, no send — dev default)
 * OTP_PROVIDER=msg91  -> MSG91 SMS API via MSG91_AUTH_KEY/MSG91_TEMPLATE_ID
 */

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function isValidIndianPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone);
}

async function sendViaConsole(phone: string, otp: string) {
  console.log(`[OTP:console] Phone: ${phone} | OTP: ${otp}`);
}

async function sendViaMsg91(phone: string, otp: string) {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;
  if (!authKey || !templateId) {
    console.warn('[OTP:msg91] MSG91_AUTH_KEY/MSG91_TEMPLATE_ID not set, falling back to console log');
    return sendViaConsole(phone, otp);
  }

  const res = await fetch('https://control.msg91.com/api/v5/otp', {
    method: 'POST',
    headers: {
      authkey: authKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      template_id: templateId,
      mobile: `91${phone}`,
      otp,
    }),
  });

  if (!res.ok) {
    console.error('[OTP:msg91] Send failed:', await res.text());
  }
}

export async function sendOtp(phone: string, otp: string): Promise<void> {
  const provider = process.env.OTP_PROVIDER;
  try {
    if (provider === 'msg91') {
      await sendViaMsg91(phone, otp);
    } else {
      await sendViaConsole(phone, otp);
    }
  } catch (err) {
    console.error('[OTP] Failed to send:', err);
  }
}
