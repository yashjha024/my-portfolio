import React from 'react';
import { Container } from '../../components/layout/Container.jsx';
import { Section } from '../../components/layout/Section.jsx';
import { SEO } from '../../components/shared/SEO.jsx';

export const PrivacyPage = () => (
  <>
    <SEO title="Privacy" description="How this portfolio handles contact-form and analytics data." />
    <Section className="py-16 sm:py-24">
      <Container>
        <article className="mx-auto max-w-3xl space-y-8 text-muted-foreground">
          <header className="space-y-3"><h1 className="font-heading text-4xl font-bold text-foreground">Privacy</h1><p>This portfolio collects only the information needed to respond to enquiries and understand site performance.</p></header>
          <section><h2 className="mb-2 font-heading text-2xl font-semibold text-foreground">Contact form</h2><p>Submitting the contact form stores your name, email address, subject, message, and limited anti-abuse metadata. This information is used solely to respond to your enquiry and is retained for up to 12 months unless a longer retention period is legally required.</p></section>
          <section><h2 className="mb-2 font-heading text-2xl font-semibold text-foreground">Analytics</h2><p>Optional, consent-aware analytics may measure aggregate page visits and engagement. They are not used for advertising or to sell personal data.</p></section>
          <section><h2 className="mb-2 font-heading text-2xl font-semibold text-foreground">Your choices</h2><p>You may request access to or deletion of your contact-form data by using the email address listed on the contact page.</p></section>
        </article>
      </Container>
    </Section>
  </>
);
