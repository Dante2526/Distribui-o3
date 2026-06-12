import React from 'react';

// --- Custom Icons from PAINEL-DSS ---
export const ExchangeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 1l4 4-4 4"></path>
    <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
    <path d="M7 23l-4-4 4-4"></path>
    <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
  </svg>
);

export const HelpIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);
