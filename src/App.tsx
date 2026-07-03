import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load heavy routes — only Portfolio is loaded on the main page
const Portfolio = lazy(() => import('./components/Portfolio'));
const Admin     = lazy(() => import('./components/Admin'));
const NotFound  = lazy(() => import('./components/NotFound'));

// Minimal full-screen loader shown while route chunks download
const RouteLoader = () => (
  <div className="fixed inset-0 bg-[#08080a] flex items-center justify-center z-[9999]">
    <div className="w-6 h-6 rounded-full border border-amber-500/30 border-t-amber-500 animate-spin" />
  </div>
);

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <BrowserRouter>
          <Suspense fallback={<RouteLoader />}>
            <Routes>
              <Route path="/"      element={<Portfolio />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*"      element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
