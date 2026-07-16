import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, FileText, Briefcase, BookOpen } from 'lucide-react';
import { Container } from '../../components/layout/Container.jsx';
import { Section } from '../../components/layout/Section.jsx';
import { SEO } from '../../components/shared/SEO.jsx';

/**
 * Interactive 404 Page Not Found Component.
 * Guides users back to core work and thinking modules without dead ends.
 */
export const NotFoundPage = () => {
  return (
    <>
      <SEO
        title="404 Page Not Found"
        description="The requested page could not be found. Return to Yash Jha's product and AI/ML engineering portfolio."
        type="website"
      />

      <Section className="py-24 md:py-32 flex items-center justify-center min-h-[75vh]">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-2xl mx-auto text-center space-y-8 bg-slate-900/60 border border-slate-800 p-8 sm:p-12 rounded-3xl backdrop-blur-md shadow-2xl"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono text-3xl font-extrabold shadow-inner">
              404
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-heading tracking-tight">
                Page Not Found or Relocated
              </h1>
              <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto leading-relaxed">
                The artifact or URL you requested does not exist, has been archived, or was moved during our recent system migration.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
              <Link
                to="/work"
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all flex flex-col items-center text-center gap-2 group"
              >
                <Briefcase className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-white">Case Studies</span>
                <span className="text-[10px] text-slate-500">Evidence &amp; Shipped Work</span>
              </Link>

              <Link
                to="/thinking"
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all flex flex-col items-center text-center gap-2 group"
              >
                <BookOpen className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-white">Product Thinking</span>
                <span className="text-[10px] text-slate-500">Teardowns &amp; Strategy</span>
              </Link>

              <Link
                to="/prds"
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all flex flex-col items-center text-center gap-2 group"
              >
                <FileText className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-white">PRD Specifications</span>
                <span className="text-[10px] text-slate-500">Engineering Artifacts</span>
              </Link>
            </div>

            <div className="pt-4 border-t border-slate-800/80">
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-indigo-600/20"
              >
                <Home className="w-4 h-4" /> Return to Home Dashboard
              </Link>
            </div>
          </motion.div>
        </Container>
      </Section>
    </>
  );
};
