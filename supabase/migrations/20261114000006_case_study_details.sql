-- ============================================================================
-- PRODUCT MANAGEMENT PORTFOLIO PLATFORM — SUPABASE POSTGRESQL SCHEMA
-- Migration: 20261114000006_case_study_details.sql
-- Description: Adds a structured `details` JSONB document to case studies. It powers the
--              interactive case-study blocks (PM / Builder lenses, feature status ledger,
--              pipeline diagram, decision log, investigation walkthrough, pivot timeline and
--              evidence index). The contract is documented in client/src/utils/caseStudyDetails.js.
-- Idempotent: safe to re-run.
-- ============================================================================

ALTER TABLE case_studies
  ADD COLUMN IF NOT EXISTS details JSONB NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'case_studies_details_is_object'
  ) THEN
    ALTER TABLE case_studies
      ADD CONSTRAINT case_studies_details_is_object CHECK (jsonb_typeof(details) = 'object');
  END IF;
END $$;
