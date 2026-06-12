import React from 'react';
import { Inbox, Layers, UserCog, LayoutGrid } from 'lucide-react';

interface DeptIconProps {
  iconName: string;
  className?: string;
}

export function DeptIcon({ iconName, className }: DeptIconProps) {
  switch (iconName) {
    case 'Inbox':
      return <Inbox className={className} strokeWidth={1.5} />;
    case 'Layers':
      return <Layers className={className} strokeWidth={1.5} />;
    case 'UserCog':
      return <UserCog className={className} strokeWidth={1.5} />;
    default:
      return <LayoutGrid className={className} strokeWidth={1.5} />;
  }
}
