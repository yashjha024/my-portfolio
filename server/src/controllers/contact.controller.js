import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email is required'),
  subject: z.string().min(3, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  honeypot: z.string().optional(),
});

export const submitContactForm = async (req, res, next) => {
  try {
    const validatedData = contactSchema.parse(req.body);

    // Spam check / Honeypot per PRD Section 9
    if (validatedData.honeypot && validatedData.honeypot.trim() !== '') {
      return res.status(200).json({ success: true, message: 'Message sent successfully' });
    }

    console.info(`Contact message received from ${validatedData.name} (${validatedData.email})`);

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
