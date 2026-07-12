import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { RowPortalsProvider } from './contexts/RowPortalsContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RowPortalsProvider>
      <App />
    </RowPortalsProvider>
  </StrictMode>,
);
