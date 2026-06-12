import React from 'react';

export const StatCard = React.memo(({ label, value, colorClass, bgClass }: { label: string; value: number; colorClass: string; bgClass: string }) => (
  <div className={`text-center py-2 px-3.5 rounded-xl min-w-[95px] border border-white/5 transition-all shadow-sm ${bgClass}`}>
    <div className={`text-[24px] font-black mb-0.5 tracking-tight ${colorClass}`}>{value}</div>
    <div className="text-[10px] text-[#a0aec0] uppercase font-bold tracking-wider">{label}</div>
  </div>
));
