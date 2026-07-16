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
  if (!process.env.RESEND_API_KEY) return false;
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
  if (!response.ok) throw new Error('Contact email delivery failed');
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

    const { error: dbError } = await supabase
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

    if (dbError) {
      console.error('Database error storing contact message:', dbError);
      return res
        .status(500)
        .json({ success: false, error: 'Failed to store contact inquiry in database.' });
    }
    await deliverContactEmail({
      name: validatedData.name,
      email: validatedData.email,
      subject: fullSubject,
      message: validatedData.message,
    });

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
