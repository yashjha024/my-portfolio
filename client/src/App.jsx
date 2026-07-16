import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PublicLayout } from './components/layout/PublicLayout.jsx';
import { ProtectedAdminRoute } from './components/shared/ProtectedAdminRoute.jsx';
import { AdminLayout } from './components/admin/AdminLayout.jsx';
import { ErrorBoundary } from './components/shared/ErrorBoundary.jsx';
import { GlobalPageLoader } from './components/shared/GlobalPageLoader.jsx';
import { Analytics } from './components/shared/Analytics.jsx';

// Code-Split Public Pages via React.lazy
const HomePage = React.lazy(() =>
  import('./pages/public/Home.jsx').then((m) => ({ default: m.Home }))
);
const WorkIndexPage = React.lazy(() =>
  import('./pages/public/Work.jsx').then((m) => ({ default: m.WorkIndexPage }))
);
const CaseStudyDetailPage = React.lazy(() =>
  import('./pages/public/CaseStudyDetail.jsx').then((m) => ({ default: m.CaseStudyDetailPage }))
);
const ThinkingIndexPage = React.lazy(() =>
  import('./pages/public/Thinking.jsx').then((m) => ({ default: m.ThinkingIndexPage }))
);
const ArticleDetailPage = React.lazy(() =>
  import('./pages/public/ArticleDetail.jsx').then((m) => ({ default: m.ArticleDetailPage }))
);
const PrdsIndexPage = React.lazy(() =>
  import('./pages/public/Prds.jsx').then((m) => ({ default: m.PrdsIndexPage }))
);
const PrdDetailPage = React.lazy(() =>
  import('./pages/public/PrdDetail.jsx').then((m) => ({ default: m.PrdDetailPage }))
);
const AboutPage = React.lazy(() =>
  import('./pages/public/About.jsx').then((m) => ({ default: m.AboutPage }))
);
const ResumePage = React.lazy(() =>
  import('./pages/public/Resume.jsx').then((m) => ({ default: m.ResumePage }))
);
const ContactPage = React.lazy(() =>
  import('./pages/public/Contact.jsx').then((m) => ({ default: m.ContactPage }))
);
const PrivacyPage = React.lazy(() =>
  import('./pages/public/Privacy.jsx').then((m) => ({ default: m.PrivacyPage }))
);
const NotFoundPage = React.lazy(() =>
  import('./pages/public/NotFound.jsx').then((m) => ({ default: m.NotFoundPage }))
);

// Code-Split Auth Pages
const Login = React.lazy(() =>
  import('./pages/auth/Login.jsx').then((m) => ({ default: m.Login }))
);
const AuthCallback = React.lazy(() =>
  import('./pages/auth/AuthCallback.jsx').then((m) => ({ default: m.AuthCallback }))
);

// Code-Split Admin CMS Pages
const AdminDashboard = React.lazy(() =>
  import('./pages/admin/Dashboard.jsx').then((m) => ({ default: m.Dashboard }))
);
const ManageWorkPage = React.lazy(() =>
  import('./pages/admin/ManageWork.jsx').then((m) => ({ default: m.ManageWorkPage }))
);
const EditWorkPage = React.lazy(() =>
  import('./pages/admin/EditWork.jsx').then((m) => ({ default: m.EditWorkPage }))
);
const ManageThinkingPage = React.lazy(() =>
  import('./pages/admin/ManageThinking.jsx').then((m) => ({ default: m.ManageThinkingPage }))
);
const EditThinkingPage = React.lazy(() =>
  import('./pages/admin/EditThinking.jsx').then((m) => ({ default: m.EditThinkingPage }))
);
const ManagePrdsPage = React.lazy(() =>
  import('./pages/admin/ManagePrds.jsx').then((m) => ({ default: m.ManagePrdsPage }))
);
const EditPrdPage = React.lazy(() =>
  import('./pages/admin/EditPrd.jsx').then((m) => ({ default: m.EditPrdPage }))
);
const ManageMediaPage = React.lazy(() =>
  import('./pages/admin/ManageMedia.jsx').then((m) => ({ default: m.ManageMediaPage }))
);
const ManageMessagesPage = React.lazy(() =>
  import('./pages/admin/ManageMessages.jsx').then((m) => ({ default: m.ManageMessagesPage }))
);
const AdminSettingsPage = React.lazy(() =>
  import('./pages/admin/AdminSettings.jsx').then((m) => ({ default: m.AdminSettingsPage }))
);

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Analytics />
        <Suspense fallback={<GlobalPageLoader />}>
          <Routes>
            {/* Public Routes with Shared Header, Footer, and Auto-Scroll */}
            <Route element={<PublicLayout />}>
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
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Protected Private Admin Routes per PRD Section 4 & 8 */}
            <Route element={<ProtectedAdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />

                <Route path="/admin/work" element={<ManageWorkPage />} />
                <Route path="/admin/work/new" element={<EditWorkPage />} />
                <Route path="/admin/work/:id" element={<EditWorkPage />} />
                <Route path="/admin/work/edit/:id" element={<EditWorkPage />} />

                <Route path="/admin/thinking" element={<ManageThinkingPage />} />
                <Route path="/admin/thinking/new" element={<EditThinkingPage />} />
                <Route path="/admin/thinking/:id" element={<EditThinkingPage />} />
                <Route path="/admin/thinking/edit/:id" element={<EditThinkingPage />} />

                <Route path="/admin/prds" element={<ManagePrdsPage />} />
                <Route path="/admin/prds/new" element={<EditPrdPage />} />
                <Route path="/admin/prds/:id" element={<EditPrdPage />} />
                <Route path="/admin/prds/edit/:id" element={<EditPrdPage />} />

                <Route path="/admin/media" element={<ManageMediaPage />} />
                <Route path="/admin/messages" element={<ManageMessagesPage />} />
                <Route path="/admin/settings" element={<AdminSettingsPage />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
