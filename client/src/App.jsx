import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import {
  HomePage,
  WorkIndexPage,
  CaseStudyDetailPage,
  ThinkingIndexPage,
  ArticleDetailPage,
  PrdsIndexPage,
  PrdDetailPage,
  AboutPage,
  ResumePage,
  ContactPage,
} from './pages/public/index.js';
import {
  AdminDashboard,
  ManageWorkPage,
  EditWorkPage,
  ManageThinkingPage,
  EditThinkingPage,
  ManagePrdsPage,
  EditPrdPage,
  ManageMediaPage,
  AdminSettingsPage,
} from './pages/admin/index.js';
import { ProtectedAdminRoute } from './components/shared/ProtectedAdminRoute.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/work" element={<WorkIndexPage />} />
        <Route path="/work/:slug" element={<CaseStudyDetailPage />} />
        <Route path="/thinking" element={<ThinkingIndexPage />} />
        <Route path="/thinking/:slug" element={<ArticleDetailPage />} />
        <Route path="/prds" element={<PrdsIndexPage />} />
        <Route path="/prds/:slug" element={<PrdDetailPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/resume" element={<ResumePage />} />
        <Route path="/contact" element={<ContactPage />} />

        {/* Protected Private Admin Routes per PRD Section 4 & 8 */}
        <Route element={<ProtectedAdminRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/work" element={<ManageWorkPage />} />
          <Route path="/admin/work/:id" element={<EditWorkPage />} />
          <Route path="/admin/thinking" element={<ManageThinkingPage />} />
          <Route path="/admin/thinking/:id" element={<EditThinkingPage />} />
          <Route path="/admin/prds" element={<ManagePrdsPage />} />
          <Route path="/admin/prds/:id" element={<EditPrdPage />} />
          <Route path="/admin/media" element={<ManageMediaPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
