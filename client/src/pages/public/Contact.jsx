import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Mail, Send, CheckCircle, MapPin, MessageSquare, ArrowRight, AlertCircle } from 'lucide-react';
import api from '../../services/api.js';
import { Github, Linkedin } from '../../components/ui/Icon.jsx';
import { usePortfolioData } from '../../hooks/usePortfolioData.js';
import { Container } from '../../components/layout/Container.jsx';
import { Section } from '../../components/layout/Section.jsx';
import { Grid } from '../../components/layout/Grid.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { FormGroup } from '../../components/ui/FormGroup.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Textarea } from '../../components/ui/Textarea.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { SEO } from '../../components/shared/SEO.jsx';
import { BreadcrumbNav } from '../../components/shared/BreadcrumbNav.jsx';

const contactSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  subject: z.string().min(3, { message: 'Subject is required' }),
  purpose: z.string().min(1, { message: 'Please select an inquiry purpose' }),
  message: z.string().min(10, { message: 'Message must be at least 10 characters' }),
});

export const ContactPage = () => {
  const { data: profile } = usePortfolioData({ type: 'profile', delayMs: 100 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      purpose: 'Hiring / Role Discussion',
      message: '',
    },
  });

  const onSubmit = async (_data) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const response = await api.post('/contact', _data);
      if (response.data && response.data.success) {
        setIsSubmitted(true);
        reset();
      } else {
        setSubmitError(response.data?.message || 'Failed to send message. Please try again.');
      }
    } catch (err) {
      console.error('Contact submission error:', err);
      const errMsg =
        err.response?.data?.errors?.[0]?.message ||
        err.response?.data?.error ||
        err.message ||
        'Error sending message. Please check your network or try again later.';
      setSubmitError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Contact Me', url: '/contact' },
  ];

  return (
    <>
      <SEO
        title="Contact Me & Let's Talk"
        description="Get in touch with Yash Jha for product management roles, AI/ML engineering, or technical collaborations."
        type="website"
        breadcrumbs={breadcrumbs}
      />

      {/* Header Section */}
      <Section className="pt-10 pb-12 md:pt-16 md:pb-16 border-b border-border/40 bg-gradient-to-b from-background to-muted/20">
        <Container>
          <div className="max-w-3xl space-y-4">
            <BreadcrumbNav items={breadcrumbs} />
            <Badge variant="outline" className="flex items-center gap-1.5 w-max">
              <MessageSquare className="w-3.5 h-3.5 text-primary" /> Direct Communication
            </Badge>
            <h1 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl text-foreground leading-tight">
              Let&apos;s Connect
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Whether you are evaluating candidates for a Product Manager or AI/ML Engineer role, seeking workflow advisory, or simply want to discuss 0-to-1 execution across AI and commerce, I would love to talk.
            </p>
          </div>
        </Container>
      </Section>

      {/* Contact Content Section */}
      <Section className="py-16 sm:py-20">
        <Container>
          <Grid cols={2} gap="lg" className="items-start">
            {/* Left Column: Direct Links & Info */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <h2 className="font-heading text-2xl font-bold text-foreground">
                  Direct Contact Information
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  I respond to all professional inquiries within 24 hours. Feel free to reach out directly via email or connect on LinkedIn.
                </p>
              </div>

              <div className="space-y-4">
                {/* Email Box */}
                <a
                  href={`mailto:${profile?.email || 'yashjha024@gmail.com'}`}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Direct Email
                    </span>
                    <span className="font-heading font-bold text-base text-foreground group-hover:text-primary transition-colors">
                      {profile?.email || 'yashjha024@gmail.com'}
                    </span>
                  </div>
                </a>

                {/* LinkedIn Box */}
                <a
                  href={profile?.linkedin || 'https://linkedin.com/in/yashjha024'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Linkedin className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Professional Network
                    </span>
                    <span className="font-heading font-bold text-base text-foreground group-hover:text-primary transition-colors">
                      yashjha024 <ArrowRight className="inline w-3.5 h-3.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                  </div>
                </a>

                {/* GitHub Box */}
                <a
                  href={profile?.github || 'https://github.com/yashjha024'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Github className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Source Code &amp; Repositories
                    </span>
                    <span className="font-heading font-bold text-base text-foreground group-hover:text-primary transition-colors">
                      github.com/yashjha024 <ArrowRight className="inline w-3.5 h-3.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                  </div>
                </a>

                {/* Location Box */}
                <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-muted/40">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Base &amp; Timezone
                    </span>
                    <span className="font-heading font-bold text-base text-foreground">
                      {profile?.location || 'Delhi, IN (IST / UTC+5:30)'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Column: Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="p-6 sm:p-8 rounded-2xl border border-border bg-card shadow-md space-y-6"
            >
              <div>
                <h3 className="font-heading text-xl font-bold text-foreground">Send a Message</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  All submissions are encrypted and delivered directly to my private inbox.
                </p>
              </div>

              {isSubmitted ? (
                <div className="p-8 rounded-xl bg-success/10 border border-success/30 text-center space-y-4 my-6">
                  <CheckCircle className="w-12 h-12 text-success mx-auto" />
                  <h4 className="font-heading font-bold text-lg text-foreground">Message Received!</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    Thank you for getting in touch. I have received your message and will get back to you shortly.
                  </p>
                  <Button variant="outline" size="sm" onClick={() => setIsSubmitted(false)}>
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {submitError && (
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-3 mb-4">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
                      <div>
                        <strong className="block font-semibold mb-0.5">Submission Error</strong>
                        <span>{submitError}</span>
                      </div>
                    </div>
                  )}
                  <FormGroup label="Your Name" required error={errors.name?.message}>
                    <Input
                      {...register('name')}
                      placeholder="Jane Doe"
                      error={!!errors.name}
                      autoComplete="name"
                    />
                  </FormGroup>

                  <FormGroup label="Email Address" required error={errors.email?.message}>
                    <Input
                      {...register('email')}
                      type="email"
                      placeholder="jane.doe@company.com"
                      error={!!errors.email}
                      autoComplete="email"
                    />
                  </FormGroup>

                  <Grid cols={2} gap="md">
                    <FormGroup label="Inquiry Purpose" required error={errors.purpose?.message}>
                      <Select {...register('purpose')} error={!!errors.purpose}>
                        <option value="Hiring / Role Discussion">Hiring / Role Discussion</option>
                        <option value="Consulting / Advisory">Consulting / Advisory</option>
                        <option value="Speaking / Podcast">Speaking / Podcast</option>
                        <option value="General Inquiry">General Inquiry</option>
                      </Select>
                    </FormGroup>

                    <FormGroup label="Subject" required error={errors.subject?.message}>
                      <Input
                        {...register('subject')}
                        placeholder="Product Opportunity..."
                        error={!!errors.subject}
                      />
                    </FormGroup>
                  </Grid>

                  <FormGroup
                    label="Your Message"
                    required
                    description="Please provide context or any links regarding the inquiry."
                    error={errors.message?.message}
                  >
                    <Textarea
                      {...register('message')}
                      rows={5}
                      placeholder="Hello Yash, we are looking for a Product Professional / AI Engineer to lead..."
                      error={!!errors.message}
                    />
                  </FormGroup>

                  <Button type="submit" size="lg" className="w-full font-semibold shadow-md mt-2" isLoading={isSubmitting}>
                    <Send className="mr-2 w-4 h-4" /> Send Message
                  </Button>
                </form>
              )}
            </motion.div>
          </Grid>
        </Container>
      </Section>
    </>
  );
};
