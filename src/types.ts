import React from "react";
import {
  Palmtree,
  LogOut,
  Activity,
  ShieldAlert,
  FileText,
  UserCog,
  RefreshCw,
  User,
} from "lucide-react";

// --- Turma Type ---
export type TurmaType = "A" | "B" | "C" | "D";

// --- Status Types ---
export type StatusType =
  | "FÉRIAS"
  | "FORA"
  | "ATM"
  | "RESTRIÇÃO"
  | "INSS"
  | "TREINAMENTO"
  | "REVEZAMENTO"
  | "ESTÁGIO";

export const STATUS_METADATA: Record<
  StatusType,
  {
    label: string;
    colorDark: string;
    colorLight: string;
    dotColor: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  FÉRIAS: {
    label: "FÉRIAS",
    colorDark: "text-[#30D158]",
    colorLight: "text-[#16A34A]",
    dotColor: "bg-[#30D158]",
    icon: Palmtree,
  },
  FORA: {
    label: "FORA",
    colorDark: "text-[#FF453A]",
    colorLight: "text-[#EF4444]",
    dotColor: "bg-[#FF453A]",
    icon: LogOut,
  },
  ATM: {
    label: "ATM",
    colorDark: "text-[#FFD60A]",
    colorLight: "text-[#D97706]",
    dotColor: "bg-[#FFD60A]",
    icon: Activity,
  },
  RESTRIÇÃO: {
    label: "RESTRIÇÃO",
    colorDark: "text-[#BF5AF2]",
    colorLight: "text-[#8B5CF6]",
    dotColor: "bg-[#BF5AF2]",
    icon: ShieldAlert,
  },
  INSS: {
    label: "INSS",
    colorDark: "text-[#FF453A]",
    colorLight: "text-[#EF4444]",
    dotColor: "bg-[#FF453A]",
    icon: FileText,
  },
  TREINAMENTO: {
    label: "TREINAMENTO",
    colorDark: "text-[#0A84FF]",
    colorLight: "text-[#2563EB]",
    dotColor: "bg-[#0A84FF]",
    icon: UserCog,
  },
  REVEZAMENTO: {
    label: "REVEZAMENTO",
    colorDark: "text-[#32ADE6]",
    colorLight: "text-[#0284C7]",
    dotColor: "bg-[#32ADE6]",
    icon: RefreshCw,
  },
  ESTÁGIO: {
    label: "ESTÁGIO",
    colorDark: "text-[#10B981]",
    colorLight: "text-[#059669]",
    dotColor: "bg-[#10B981]",
    icon: User,
  },
};

// --- Data Models ---
export type Employee = {
  id: string;
  name: string;
  matricula?: string;
  line: string;
  machine: string;
  error?: boolean;
  originalDeptId?: string;
  originalSupportGroupIndex?: number;
  originalSupportRole?: string;
  tagType?: "MAQUINISTA" | "OOF";
};

export type DepartmentOption = {
  id: string;
  title: string;
};

export type Department = {
  id: string;
  title: string;
  data: Employee[];
  count: number;
};

export type SupportRole = {
  id: string;
  name: string;
  role: string;
  matricula?: string;
};

export type AnnotationItem = {
  id: string;
  name: string;
  status: string;
  matricula?: string;
  originalDeptId?: string;
};

export type AnnotationGroup = {
  title: string;
  items: AnnotationItem[];
};

export interface ActiveEdit {
  empId: string;
  userName: string;
  color: string;
  timestamp: number;
}

export interface BoardState {
  departmentsData: Department[];
  supportRolesData: SupportRole[][];
  annotationsLeft: AnnotationGroup[];
  annotationsRight: AnnotationGroup[];
  specialShiftData: Employee[];
}

export const MOCK_USERS = [
  { name: "Ana (Simulado)", color: "#0A84FF" },
  { name: "Carlos (Simulado)", color: "#30D158" },
  { name: "João (Simulado)", color: "#FF9F0A" },
  { name: "Maria (Simulado)", color: "#FF2D55" },
  { name: "Pedro (Simulado)", color: "#FFD60A" },
  { name: "Lucas (Simulado)", color: "#FF3B30" },
  { name: "Naylan (Você)", color: "#BF5AF2" },
];

export interface MovementLog {
  id: string;
  adminName: string;
  employeeName: string;
  from: string;
  to: string;
  line?: string;
  machine?: string;
  timestamp: Date;
}
export type HistoryStatus = "BEM" | "MAL" | "AUS" | "PEN";

export interface HistoryEmployee {
  m: string;
  n: string;
  s: HistoryStatus;
  t: string | null;
  turno: string;
}

export interface HistoryRegistro {
  assunto: string;
  matricula: string;
  name: string;
}

export interface HistoryRecord {
  data: string;
  dataISO: string;
  turma: string;
  registros7H: HistoryRegistro[];
  registros6H: HistoryRegistro[];
  r: HistoryEmployee[];
  totalFuncionarios: number;
  totalPresentes: number;
  totalAusentes: number;
  totalMal: number;
  totalPendentes: number;
}

export interface Administrator {
  id: string;
  name: string;
  matricula: string;
  email: string;
  senha?: string;
  nivel?: string;
}
