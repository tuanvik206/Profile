import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

window.onerror = function (message, source, lineno, colno, error) {
  const container = document.createElement('div');
  container.style.cssText = 'color:red;padding:20px;z-index:9999;position:relative;';

  const heading = document.createElement('h1');
  heading.textContent = 'Runtime Error';

  const detail = document.createElement('p');
  detail.textContent = typeof message === 'string' ? message : 'Unknown error';

  const stack = document.createElement('pre');
  stack.textContent = error?.stack ?? '';

  container.append(heading, detail, stack);
  document.body.replaceChildren(container);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
