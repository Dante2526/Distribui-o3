import React from 'react';
import { createPortal } from 'react-dom';

export function PortalMenu({ children }: { children: React.ReactNode }) {
  return createPortal(children, document.body);
}
