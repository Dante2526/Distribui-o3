import React from "react";
import DarkModeToggle from "./DarkModeToggle";

interface ThemeSelectionScreenProps {
  isDarkMode: boolean;
  onToggleDarkMode: (e?: any) => void;
  onContinue: () => void;
}

const ThemeSelectionScreen: React.FC<ThemeSelectionScreenProps> = ({
  isDarkMode,
  onToggleDarkMode,
  onContinue,
}) => {
  return (
    <div
      className={`h-[100dvh] w-full transition-colors flex flex-col items-center justify-center p-2 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] overflow-hidden relative ${
        isDarkMode
          ? "bg-[#111217] text-[#f7fafc]"
          : "bg-[#eef2f7] text-[#1a202c]"
      }`}
    >
      <div className="flex flex-col items-center text-center max-w-md w-full px-4 z-10 flex-grow justify-center">
        <img
          src="/favicon.svg"
          alt="Logo Distribuição"
          className="h-12 w-12 md:h-16 md:w-16 mb-2"
        />
        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-1">
          Bem-vindo ao Distribuição
        </h1>
        <p
          className={`text-sm md:text-lg mb-4 md:mb-8 ${isDarkMode ? "text-[#a0aec0]" : "text-[#4a5568]"}`}
        >
          Antes de começar, defina o tema.
        </p>

        {/* Container do BB8 com instruções */}
        <div
          className={`border-2 p-4 md:p-5 rounded-2xl md:rounded-3xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center gap-2 w-fit px-8 md:px-12 mx-auto mb-6 ${
            isDarkMode
              ? "bg-[#1E2029] border-white/10"
              : "bg-white border-[#cbd5e0]"
          }`}
        >
          <p
            className={`font-bold text-base md:text-xl ${isDarkMode ? "text-[#a0aec0]" : "text-[#4a5568]"}`}
          >
            {isDarkMode ? "🌙 MODO ESCURO" : "☀️ MODO CLARO"}
          </p>

          <div
            style={{ "--bb8-size": "16px" } as React.CSSProperties}
            className="my-1 md:my-2"
          >
            <DarkModeToggle
              isDarkMode={isDarkMode}
              onToggle={onToggleDarkMode}
            />
          </div>

          <p className="text-xs md:text-sm font-medium opacity-70 flex items-center justify-center">
            Clique no BB-8 para alternar
          </p>
        </div>

        <button
          onClick={onContinue}
          className="w-full max-w-[280px] py-3 md:py-4 rounded-xl font-bold text-lg md:text-xl text-white bg-gradient-to-r from-[#0c7df2] to-blue-600 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
        >
          Continuar
        </button>
      </div>

      {/* Elementos decorativos no fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-3xl ${isDarkMode ? "bg-[#0c7df2]/5" : "bg-[#0c7df2]/10"}`}
        ></div>
        <div
          className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-3xl ${isDarkMode ? "bg-blue-500/5" : "bg-blue-500/10"}`}
        ></div>
      </div>
    </div>
  );
};

export default React.memo(ThemeSelectionScreen);
