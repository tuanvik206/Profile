import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

window.onerror = function(message, source, lineno, colno, error) {
  document.body.innerHTML = `<div style="color:red;padding:20px;z-index:9999;position:relative;"><h1>Runtime Error</h1><p>${message}</p><pre>${error?.stack}</pre></div>`;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
