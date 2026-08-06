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
  if (!process.env.RESEND_API_KEY) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Email provider not configured for production delivery');
    }
    return false;
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM_EMAIL || 'Portfolio Contact <onboarding@resend.dev>',
      to: [process.env.CONTACT_EMAIL || process.env.OWNER_EMAIL],
      reply_to: email,
      subject: `[Portfolio] ${subject}`,
      text: `From: ${name} <${email}>\n\n${message}`,
    }),
  });
  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unknown error');
    throw new Error(`Contact email delivery failed: ${errorBody}`);
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

    if (process.env.NODE_ENV === 'production' && !process.env.RESEND_API_KEY) {
      return res.status(503).json({
        success: false,
        error: 'Contact form is currently unavailable: email service is not configured.',
      });
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
      return res
        .status(500)
        .json({ success: false, error: 'Failed to store contact inquiry in database.' });
    }

    try {
      await deliverContactEmail({
        name: validatedData.name,
        email: validatedData.email,
        subject: fullSubject,
        message: validatedData.message,
      });
    } catch (deliveryError) {
      console.error('Email delivery error, rolling back DB row:', deliveryError);
      if (dbMessage?.id) {
        await supabase
          .from('contact_messages')
          .delete()
          .eq('id', dbMessage.id)
          .catch(() => null);
      }
      return res.status(502).json({
        success: false,
        error: 'Failed to send notification email. Please try again later.',
      });
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
