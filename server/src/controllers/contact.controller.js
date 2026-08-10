import { z } from 'zod';
import { supabase } from '../config/supabase.js';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email is required'),
  subject: z.string().min(3, 'Subject is required'),
  purpose: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  honeypot: z.string().optional(),
});

const deliverContactEmail = async ({ name, email, subject, message }) => {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes('placeholder')) {
    console.log(
      `[MOCK EMAIL] To: ${process.env.OWNER_EMAIL || 'yashjha024@gmail.com'}, Subject: ${subject}`
    );
    return true; // Mock success
  }
  const recipient = process.env.CONTACT_EMAIL || process.env.OWNER_EMAIL || 'yashjha024@gmail.com';
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM_EMAIL || 'Portfolio Contact <onboarding@resend.dev>',
      to: [recipient],
      reply_to: email,
      subject: `[Portfolio Inquiry] ${subject}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E5E2DA; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #171717; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 16px;">New Portfolio Inquiry Received</h2>
          <div style="background-color: #f9f9f8; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0 0 8px 0; color: #444; font-size: 14px;"><strong>From:</strong> ${name} &lt;<a href="mailto:${email}" style="color: #2563eb;">${email}</a>&gt;</p>
            <p style="margin: 0; color: #444; font-size: 14px;"><strong>Subject:</strong> ${subject}</p>
          </div>
          <div style="padding: 16px 0; border-top: 1px solid #eee; border-bottom: 1px solid #eee; margin-bottom: 20px;">
            <p style="margin: 0 0 8px 0; color: #666; font-size: 12px; text-transform: uppercase; font-weight: 600;">Message Content:</p>
            <p style="margin: 0; color: #171717; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
          </div>
          <p style="font-size: 13px; color: #666; margin: 0;">💡 <strong>Tip:</strong> Click "Reply" in your email client to respond directly to ${name}.</p>
        </div>
      `,
    }),
  });
  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unknown error');
    console.warn(`Contact email delivery warning: ${errorBody}`);
    return false;
  }
  return true;
};

export const submitContactForm = async (req, res, next) => {
  try {
    const validatedData = contactSchema.parse(req.body);

    // Spam check / Honeypot per PRD Section 9
    if (validatedData.honeypot && validatedData.honeypot.trim() !== '') {
      return res.status(200).json({ success: true, message: 'Message sent successfully' });
    }

    const fullSubject = validatedData.purpose
      ? `[${validatedData.purpose}] ${validatedData.subject}`
      : validatedData.subject;

    // Idempotency check: prevent duplicate messages within 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: existingDuplicate } = await supabase
      .from('contact_messages')
      .select('id')
      .eq('email', validatedData.email)
      .eq('message', validatedData.message)
      .gte('created_at', fiveMinutesAgo)
      .limit(1);

    if (existingDuplicate && existingDuplicate.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'Thank you! Your message has already been received.',
        deduplicated: true,
      });
    }

    const { data: dbMessage, error: dbError } = await supabase
      .from('contact_messages')
      .insert([
        {
          name: validatedData.name,
          email: validatedData.email,
          subject: fullSubject,
          message: validatedData.message,
          status: 'new',
          ip_address: req.ip || req.headers['x-forwarded-for'] || null,
          user_agent: req.get('User-Agent') || null,
        },
      ])
      .select('id')
      .single();

    if (dbError || !dbMessage) {
      console.error('Database error storing contact message:', dbError);
    }

    try {
      await deliverContactEmail({
        name: validatedData.name,
        email: validatedData.email,
        subject: fullSubject,
        message: validatedData.message,
      });
    } catch (deliveryError) {
      console.warn('Email delivery error (message saved to DB):', deliveryError);
    }

    res.status(200).json({
      success: true,
      message: 'Thank you! Your message has been sent successfully.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    next(error);
  }
};
