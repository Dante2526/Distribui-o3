import React from "react";
import type { TurmaType } from "../types";

interface TurmaSelectionScreenProps {
  onSelect: (turma: TurmaType) => void;
}

export const TurmaSelectionScreen: React.FC<TurmaSelectionScreenProps> = ({
  onSelect,
}) => {
  return (
    <div className="min-h-screen bg-[#0F111A] flex flex-col items-center justify-center p-4">
      <div className="text-center mb-12">
        <img
          src="/favicon.svg"
          alt="Logo Distribuição"
          className="h-16 w-16 mx-auto mb-4"
        />
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2">
          Painel da Distribuição
        </h1>
        <p className="text-[#8F9BB3] text-lg">
          Selecione a turma para continuar
        </p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-[320px]">
        <button
          onClick={() => onSelect("A")}
          className="flex items-center justify-center w-full px-4 py-6 font-extrabold text-xl text-white bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
        >
          TURMA A
        </button>
        <button
          onClick={() => onSelect("B")}
          className="flex items-center justify-center w-full px-4 py-6 font-extrabold text-xl text-white bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
        >
          TURMA B
        </button>
        <button
          onClick={() => onSelect("C")}
          className="flex items-center justify-center w-full px-4 py-6 font-extrabold text-xl text-white bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
        >
          TURMA C
        </button>
        <button
          onClick={() => onSelect("D")}
          className="flex items-center justify-center w-full px-4 py-6 font-extrabold text-xl text-white bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
        >
          TURMA D
        </button>
      </div>
    </div>
  );
};
