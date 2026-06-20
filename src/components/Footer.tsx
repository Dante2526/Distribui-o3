import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-max mx-auto bg-[#1E2029] border border-white/5 rounded-full px-4 py-2 md:px-6 md:py-3 shadow-lg text-center text-[10px] md:text-xs text-[#a0aec0] transition-colors">
      <div className="flex items-center justify-center gap-2 md:gap-4">
        <span className="font-bold opacity-70 tracking-wider">DESENVOLVIDO POR NEAR</span>
      </div>
    </footer>
  );
};

export default Footer;
