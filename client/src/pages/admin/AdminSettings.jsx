import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { MediaPickerModal } from '../../components/admin/MediaPickerModal.jsx';
import {
  Settings as SettingsIcon,
  Save,
  Loader2,
  Check,
  AlertCircle,
  User,
  FileText,
  Share2,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react';

export const AdminSettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [error, setError] = useState(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState('profile_photo_url'); // profile_photo_url or resume_url

  const [formData, setFormData] = useState({
    profile_photo_url: '',
    headline: '',
    biography: '',
    email: '',
    resume_url: '',
    social_links: {
      github: '',
      linkedin: '',
      twitter: '',
      substack: '',
    },
    footer_details: { copyright: '' },
    consent_text: '',
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/settings');
      if (res.data?.success && res.data?.data) {
        const item = res.data.data;
        setFormData({
          profile_photo_url: item.profile_photo_url || '',
          headline: item.headline || '',
          biography: item.biography || '',
          email: item.email || '',
          resume_url: item.resume_url || '',
          social_links: {
            github: item.social_links?.github || '',
            linkedin: item.social_links?.linkedin || '',
            twitter: item.social_links?.twitter || '',
            substack: item.social_links?.substack || '',
          },
          footer_details: { copyright: item.footer_details?.copyright || '' },
          consent_text: item.consent_text || '',
        });
      }
    } catch (err) {
      console.error('Failed to load site settings:', err);
      setError('Could not fetch site settings from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSuccessMsg(null);
  };

  const handleSocialChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      social_links: {
        ...prev.social_links,
        [key]: value,
      },
    }));
    setSuccessMsg(null);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);

      const res = await api.put('/admin/settings', formData);
      if (res.data?.success) {
        setSuccessMsg('Global portfolio settings saved successfully and published to public site.');
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error('Save error:', err);
      setError(err?.response?.data?.error || 'Failed to update site settings.');
    } finally {
      setSaving(false);
    }
  };

  const openMediaPicker = (targetField) => {
    setMediaPickerTarget(targetField);
    setMediaPickerOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        <span className="font-mono text-xs uppercase text-slate-400">
          Loading Site Configuration...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-slate-700/60 bg-slate-800 p-3 text-slate-300">
            <SettingsIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Global Site Configuration
            </h1>
            <p className="mt-0.5 text-sm text-slate-400">
              Customize your profile identity, downloadable resume URL, social channels, and
              compliance notices
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-500 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>Save Changes</span>
        </button>
      </div>

      {successMsg && (
        <div className="animate-fadeIn flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          <Check className="h-5 w-5 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Profile & Identity */}
        <div className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <User className="h-4 w-4 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Executive Profile & Positioning</h2>
          </div>

          <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-3">
            {/* Photo Preview & Picker */}
            <div className="space-y-3">
              <label className="block font-mono text-xs uppercase text-slate-400">
                Profile Avatar / Photo
              </label>
              <div className="flex items-center gap-4">
                {formData.profile_photo_url ? (
                  <img
                    src={formData.profile_photo_url}
                    alt="Profile"
                    className="h-20 w-20 shrink-0 rounded-2xl border border-slate-800 bg-slate-950 object-cover shadow-lg"
                  />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-950 text-slate-600">
                    <User className="h-8 w-8" />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <button
                    type="button"
                    onClick={() => openMediaPicker('profile_photo_url')}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700"
                  >
                    <UploadCloud className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Choose Photo</span>
                  </button>
                  {formData.profile_photo_url && (
                    <button
                      type="button"
                      onClick={() => handleFieldChange('profile_photo_url', '')}
                      className="w-full py-1 font-mono text-[11px] text-rose-400 hover:text-rose-300"
                    >
                      Remove Avatar
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Headline & Email */}
            <div className="space-y-4 md:col-span-2">
              <div>
                <label className="mb-1.5 block font-mono text-xs uppercase text-slate-300">
                  Headline / Positioning Statement
                </label>
                <input
                  type="text"
                  placeholder="Senior Product & Program Manager | B2C Messaging & Scaled Systems"
                  value={formData.headline}
                  onChange={(e) => handleFieldChange('headline', e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm font-medium text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block font-mono text-xs uppercase text-slate-300">
                  Public Contact Email
                </label>
                <input
                  type="email"
                  placeholder="yashjha024@gmail.com"
                  value={formData.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 font-mono text-sm text-indigo-300 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block font-mono text-xs uppercase text-slate-300">
              Executive Biography Summary
            </label>
            <textarea
              rows={4}
              placeholder="7+ years building zero-to-one product features and scaling engineering programs across multi-functional teams..."
              value={formData.biography}
              onChange={(e) => handleFieldChange('biography', e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm leading-relaxed text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Section 2: Resume & Evidence PDF */}
        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <FileText className="h-4 w-4 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Resume PDF Download Attachment</h2>
          </div>
          <p className="text-xs text-slate-400">
            Provides the direct PDF link downloaded when visitors click &quot;Download Resume&quot;
            in the navigation or on `/resume`.
          </p>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="https://... or select PDF from Media Library"
              value={formData.resume_url}
              onChange={(e) => handleFieldChange('resume_url', e.target.value)}
              className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 font-mono text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => openMediaPicker('resume_url')}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700"
            >
              <UploadCloud className="h-4 w-4 text-indigo-400" />
              <span>Browse Media Library</span>
            </button>
          </div>
        </div>

        {/* Section 3: Social Networks & Channels */}
        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Share2 className="h-4 w-4 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Social Channels & External Presence</h2>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block font-mono text-xs uppercase text-slate-400">
                GitHub Profile URL
              </label>
              <input
                type="url"
                placeholder="https://github.com/username"
                value={formData.social_links.github}
                onChange={(e) => handleSocialChange('github', e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 font-mono text-sm text-indigo-300 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-xs uppercase text-slate-400">
                LinkedIn Profile URL
              </label>
              <input
                type="url"
                placeholder="https://linkedin.com/in/username"
                value={formData.social_links.linkedin}
                onChange={(e) => handleSocialChange('linkedin', e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 font-mono text-sm text-indigo-300 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-xs uppercase text-slate-400">
                Twitter / X URL
              </label>
              <input
                type="url"
                placeholder="https://x.com/username"
                value={formData.social_links.twitter}
                onChange={(e) => handleSocialChange('twitter', e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 font-mono text-sm text-indigo-300 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-xs uppercase text-slate-400">
                Substack / Medium Blog URL
              </label>
              <input
                type="url"
                placeholder="https://substack.com/@username"
                value={formData.social_links.substack}
                onChange={(e) => handleSocialChange('substack', e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 font-mono text-sm text-indigo-300 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Site Footer & Compliance Notice */}
        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <ShieldCheck className="h-4 w-4 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Footer & Compliance Disclosures</h2>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block font-mono text-xs uppercase text-slate-400">
                Footer Copyright Text
              </label>
              <input
                type="text"
                placeholder="© 2026 Product Management Portfolio. All rights reserved."
                value={formData.footer_details.copyright}
                onChange={(e) =>
                  handleFieldChange('footer_details', {
                    ...formData.footer_details,
                    copyright: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-xs uppercase text-slate-400">
                Cookie & Analytics Consent Disclosure
              </label>
              <input
                type="text"
                placeholder="We use anonymous telemetry to measure case study engagement."
                value={formData.consent_text}
                onChange={(e) => handleFieldChange('consent_text', e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </form>

      <MediaPickerModal
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={(url) => handleFieldChange(mediaPickerTarget, url)}
        allowedTypes={mediaPickerTarget === 'resume_url' ? 'pdf' : 'image'}
      />
    </div>
  );
};
