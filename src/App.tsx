import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Portfolio from './components/Portfolio';
import Admin from './components/Admin';
import { LanguageProvider } from './contexts/LanguageContext';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Portfolio />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
