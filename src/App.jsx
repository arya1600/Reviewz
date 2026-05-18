import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useAdmin } from './contexts/AdminContext';
import LoadingSpinner from './components/LoadingSpinner';

// Public / business-owner pages (eagerly bundled — used by all visitors)
import LandingPage        from './pages/LandingPage';
import PricingPage        from './pages/PricingPage';
import SignIn             from './pages/SignIn';
import ResetMpin          from './pages/ResetMpin';
import Onboarding         from './pages/Onboarding';
import BusinessSetup      from './pages/BusinessSetup';
import Dashboard          from './pages/Dashboard';
import CustomerReview     from './pages/CustomerReview';
import ReviewSuggestions  from './pages/ReviewSuggestions';
import PrivateFeedback    from './pages/PrivateFeedback';
import StoreReview        from './pages/StoreReview';

// Admin pages — lazy-loaded so they don't inflate the main bundle
const AdminLogin          = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard      = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminBusinesses     = lazy(() => import('./pages/admin/AdminBusinesses'));
const AdminBusinessDetail = lazy(() => import('./pages/admin/AdminBusinessDetail'));
const AdminSubscriptions  = lazy(() => import('./pages/admin/AdminSubscriptions'));
const AdminPayments       = lazy(() => import('./pages/admin/AdminPayments'));
const AdminSettings       = lazy(() => import('./pages/admin/AdminSettings'));

/* ── Auth guards ─────────────────────────────────────────────── */

/**
 * RequireAuth — owner-only pages (/dashboard, /setup, /onboarding).
 * Unauthenticated → /signin.
 * Admin accounts → /admin/dashboard (they have their own portal).
 */
function RequireAuth({ children }) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, adminLoading }      = useAdmin();

  if (authLoading || adminLoading) return <LoadingSpinner fullScreen />;
  if (!user)    return <Navigate to="/signin"          replace />;
  if (isAdmin)  return <Navigate to="/admin/dashboard" replace />;
  return children;
}

/**
 * RequireAdmin — admin-only pages (/admin/*).
 * Unauthenticated → /admin/login.
 * Authenticated but NOT admin (regular business owner) → /dashboard
 *   (they're in the wrong place, send them home instead of the admin login).
 */
function RequireAdmin({ children }) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, adminLoading }      = useAdmin();

  if (authLoading || adminLoading) return <LoadingSpinner fullScreen />;
  if (!user)    return <Navigate to="/admin/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard"   replace />;
  return children;
}

/**
 * RequireGuest — pages that logged-in users should NOT see (/signin, /admin/login).
 * Admins → /admin/dashboard.
 * Regular owners → /dashboard.
 * Unauthenticated → render the page as normal.
 */
function RequireGuest({ children }) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, adminLoading }      = useAdmin();

  if (authLoading || adminLoading) return <LoadingSpinner fullScreen />;
  if (user && isAdmin) return <Navigate to="/admin/dashboard" replace />;
  if (user)            return <Navigate to="/dashboard"       replace />;
  return children;
}

/* ── App ─────────────────────────────────────────────────────── */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public routes ─────────────────────────────── */}
        <Route path="/"       element={<LandingPage />} />
        <Route path="/pricing" element={<PricingPage />} />

        {/* Sign-in — redirect if already logged in */}
        <Route path="/signin"
          element={
            <RequireGuest>
              <SignIn />
            </RequireGuest>
          }
        />

        {/* MPIN reset — linked from Supabase password-reset email */}
        <Route path="/reset-mpin" element={<ResetMpin />} />

        {/* QR landing — permanent URL, subscription-gated */}
        <Route path="/r/:storeSlug"                        element={<StoreReview />} />

        {/* Legacy review flow (backwards-compatible) */}
        <Route path="/review/:businessId"                  element={<CustomerReview />} />
        <Route path="/review/:businessId/suggestions"      element={<ReviewSuggestions />} />
        <Route path="/review/:businessId/feedback"         element={<PrivateFeedback />} />

        {/* ── Business Owner routes ─────────────────────── */}
        <Route path="/onboarding"
          element={<RequireAuth><Onboarding /></RequireAuth>} />
        <Route path="/setup"
          element={<RequireAuth><BusinessSetup /></RequireAuth>} />
        <Route path="/dashboard"
          element={<RequireAuth><Dashboard /></RequireAuth>} />

        {/* ── Admin routes (lazy-loaded chunk) ──────────── */}
        <Route path="/admin"
          element={<Navigate to="/admin/dashboard" replace />} />

        {/* Admin login — redirect if already logged in as admin */}
        <Route path="/admin/login"
          element={
            <RequireGuest>
              <Suspense fallback={<LoadingSpinner fullScreen />}>
                <AdminLogin />
              </Suspense>
            </RequireGuest>
          }
        />

        <Route path="/admin/dashboard"
          element={<RequireAdmin><Suspense fallback={<LoadingSpinner fullScreen />}><AdminDashboard /></Suspense></RequireAdmin>} />
        <Route path="/admin/businesses"
          element={<RequireAdmin><Suspense fallback={<LoadingSpinner fullScreen />}><AdminBusinesses /></Suspense></RequireAdmin>} />
        <Route path="/admin/businesses/:id"
          element={<RequireAdmin><Suspense fallback={<LoadingSpinner fullScreen />}><AdminBusinessDetail /></Suspense></RequireAdmin>} />
        <Route path="/admin/subscriptions"
          element={<RequireAdmin><Suspense fallback={<LoadingSpinner fullScreen />}><AdminSubscriptions /></Suspense></RequireAdmin>} />
        <Route path="/admin/payments"
          element={<RequireAdmin><Suspense fallback={<LoadingSpinner fullScreen />}><AdminPayments /></Suspense></RequireAdmin>} />
        <Route path="/admin/settings"
          element={<RequireAdmin><Suspense fallback={<LoadingSpinner fullScreen />}><AdminSettings /></Suspense></RequireAdmin>} />

        {/* ── Catch-all ─────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
