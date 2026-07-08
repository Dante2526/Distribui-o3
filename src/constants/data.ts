import type { Department, SupportRole, AnnotationGroup } from "../types";

// --- Predefined Lines ---
export const PREDEFINED_LINES = [
  "X1",
  "X2",
  "X3",
  "X4",
  "X5",
  "X6",
  "X7",
  "VIRADOR",
  "GIROFLEX",
  "PIAL",
  "FORM - CM",
  "FORM - BX",
];

// --- Support Roles Options ---
export const SUPPORT_ROLES_OPTIONS = [
  "MIKE 02",
  "VIRADOR",
  "MIKE 03",
  "AUX X5",
  "AUX GIROFLEX",
  "MIKE 06",
  "AUX X6",
];

// --- Department Theme Helper ---
export const getDeptTheme = (deptId: string) => {
  switch (deptId) {
    case "recepcao":
      return {
        color: "text-[#0A84FF]",
        bg: "bg-[#0A84FF]/15",
        solidBg: "bg-[#0A84FF]",
        badgeBg: "bg-[#0A84FF]/90",
        iconName: "Inbox",
      };
    case "classificacao":
      return {
        color: "text-[#FF9F0A]",
        bg: "bg-[#FF9F0A]/15",
        solidBg: "bg-[#FF9F0A]",
        badgeBg: "bg-[#FF9F0A]/90",
        iconName: "Layers",
      };
    case "formacao":
      return {
        color: "text-[#30D158]",
        bg: "bg-[#30D158]/15",
        solidBg: "bg-[#30D158]",
        badgeBg: "bg-[#30D158]/90",
        iconName: "UserCog",
      };
    default:
      return {
        color: "text-[#5E5CE6]",
        bg: "bg-[#5E5CE6]/15",
        solidBg: "bg-[#5E5CE6]",
        badgeBg: "bg-[#5E5CE6]/90",
        iconName: "LayoutGrid",
      };
  }
};

// --- Initial Departments Data ---
export const initialDepartmentsData: Department[] = [
  {
    id: "recepcao",
    title: "Recepção",
    count: 6,
    data: [
      { id: "emp-" + 1, name: "LUCIANO ALVES", line: "X3", machine: "238" },
      { id: "emp-" + 2, name: "RUFINO SANTOS", line: "X2", machine: "231" },
      { id: "emp-" + 3, name: "GERALDO COSTA", line: "X2", machine: "220" },
      { id: "emp-" + 4, name: "RAFAEL LIMA", line: "X1", machine: "848" },
      { id: "emp-" + 5, name: "ARTHUR SOUZA", line: "X1", machine: "819" },
      {
        id: "emp-" + 6,
        name: "WALTERILSON SILVA",
        line: "1º CORTE",
        machine: "253",
      },
    ],
  },
  {
    id: "classificacao",
    title: "Classificação",
    count: 8,
    data: [
      { id: "emp-" + 7, name: "NAIMARA MENDES", line: "X04", machine: "805" },
      {
        id: "emp-" + 8,
        name: "DANIELLE OLIVEIRA",
        line: "X04",
        machine: "257",
      },
      { id: "emp-" + 9, name: "CID PINTO", line: "X04", machine: "259" },
      { id: "emp-" + 10, name: "IGOR RABELO", line: "X04", machine: "3949" },
      { id: "emp-" + 11, name: "NAYLAN ROCHA", line: "X05", machine: "847" },
      { id: "emp-" + 12, name: "HUMBERTO NUNES", line: "X05", machine: "743" },
      { id: "emp-" + 13, name: "PEDRO JUNIOR", line: "X05", machine: "712" },
      { id: "emp-" + 14, name: "NAYRON DIAS", line: "X05", machine: "284" },
    ],
  },
  {
    id: "formacao",
    title: "Formação",
    count: 5,
    data: [
      {
        id: "emp-" + 15,
        name: "JESSICA BARROS",
        line: "CTR2",
        machine: "2003",
      },
      { id: "emp-" + 16, name: "DANIEL ALMEIDA", line: "CTR3", machine: "270" },
      { id: "emp-" + 17, name: "GABRIEL CARVALHO", line: "4C", machine: "288" },
      { id: "emp-" + 18, name: "PEDRO CARDOSO", line: "4C", machine: "260" },
      {
        id: "emp-" + 19,
        name: "ROSANA TEIXEIRA",
        line: "201 B",
        machine: "277",
      },
    ],
  },
];

// --- Initial Support Data ---
export const initialSupportData: SupportRole[][] = [
  [
    {
      id: "emp-" + 20,
      name: "BEATRIZ SILVA",
      role: "MIKE 02",
      matricula: "00002020",
    },
    {
      id: "emp-" + 21,
      name: "AMÉRICO SANTOS",
      role: "VIRADOR",
      matricula: "00002021",
    },
    {
      id: "emp-" + 22,
      name: "ESDRAS SOUZA",
      role: "VIRADOR",
      matricula: "00002022",
    },
    {
      id: "emp-" + 23,
      name: "LARISSA COSTA",
      role: "VIRADOR",
      matricula: "00002023",
    },
  ],
  [
    {
      id: "emp-" + 24,
      name: "CAMILE BARROS",
      role: "MIKE 03",
      matricula: "00002024",
    },
    {
      id: "emp-" + 25,
      name: "ALBERTO LIMA",
      role: "AUX GIROFLEX",
      matricula: "00002025",
    },
    {
      id: "emp-" + 26,
      name: "RICARDO ROCHA",
      role: "AUX GIROFLEX",
      matricula: "00002026",
    },
  ],
  [
    {
      id: "emp-" + 27,
      name: "LUANA ALVES",
      role: "MIKE 06",
      matricula: "00002027",
    },
    {
      id: "emp-" + 28,
      name: "ROSA MENDES",
      role: "AUX X6",
      matricula: "00002028",
    },
  ],
];

// --- Initial Annotations Left ---
export const initialAnnotationsLeft: AnnotationGroup[] = [
  {
    title: "TE/TREIN./REVEZA",
    items: [
      {
        id: "emp-" + 29,
        name: "WEBERTH SILVA",
        status: "TREINAMENTO",
        matricula: "00014820",
        originalDeptId: "recepcao",
      },
      {
        id: "emp-" + 30,
        name: "RAFAEL SOUZA",
        status: "TREINAMENTO",
        matricula: "00038100",
        originalDeptId: "classificacao",
      },
      {
        id: "emp-" + 31,
        name: "ARTHUR COSTA",
        status: "TREINAMENTO",
        matricula: "00020050",
        originalDeptId: "formacao",
      },
      {
        id: "emp-" + 32,
        name: "GERALDO SANTOS",
        status: "TREINAMENTO",
        matricula: "00008490",
        originalDeptId: "recepcao",
      },
    ],
  },
  {
    title: "FÉRIAS",
    items: [
      {
        id: "emp-" + 35,
        name: "ALDO RIBEIRO",
        status: "FÉRIAS",
        matricula: "00000725",
        originalDeptId: "recepcao",
      },
      {
        id: "emp-" + 36,
        name: "KEYLSON LIMA",
        status: "FÉRIAS",
        matricula: "00000298",
        originalDeptId: "classificacao",
      },
      {
        id: "emp-" + 37,
        name: "JOANDERSON ALVES",
        status: "FÉRIAS",
        matricula: "00000801",
        originalDeptId: "formacao",
      },
    ],
  },
  {
    title: "ATM / FORA",
    items: [
      { id: "emp-empty-1", name: "", status: "", matricula: "" },
      { id: "emp-empty-2", name: "", status: "", matricula: "" },
    ],
  },
];

// --- Initial Annotations Right ---
export const initialAnnotationsRight: AnnotationGroup[] = [
  {
    title: "MAQ/OFF - ESTÁGIO",
    items: [
      {
        id: "emp-" + 41,
        name: "THAIS OLIVEIRA",
        status: "ESTÁGIO",
        matricula: "00002501",
        originalDeptId: "recepcao",
      },
      {
        id: "emp-" + 42,
        name: "ELIAS PEREIRA",
        status: "ESTÁGIO",
        matricula: "00002502",
        originalDeptId: "classificacao",
      },
      {
        id: "emp-" + 43,
        name: "JESSICA RODRIGUES",
        status: "ESTÁGIO",
        matricula: "00002503",
        originalDeptId: "formacao",
      },
      {
        id: "emp-" + 44,
        name: "GIANFRANCO NUNES",
        status: "ESTÁGIO",
        matricula: "00002504",
        originalDeptId: "recepcao",
      },
      {
        id: "emp-" + 45,
        name: "THAIS GOMES",
        status: "ESTÁGIO",
        matricula: "00002505",
        originalDeptId: "classificacao",
      },
      {
        id: "emp-" + 46,
        name: "BEATRIZ BARBOSA",
        status: "ESTÁGIO",
        matricula: "00002506",
        originalDeptId: "formacao",
      },
      {
        id: "emp-" + 47,
        name: "DENISSON MARTINS",
        status: "",
        matricula: "00002507",
        originalDeptId: "recepcao",
      },
    ],
  },
  {
    title: "RESTRIÇÃO",
    items: [
      {
        id: "emp-" + 48,
        name: "ANA PAULA SILVA",
        status: "RESTRIÇÃO",
        matricula: "00000811",
        originalDeptId: "recepcao",
      },
      {
        id: "emp-" + 49,
        name: "JONH CARDOSO",
        status: "RESTRIÇÃO",
        matricula: "00000812",
        originalDeptId: "classificacao",
      },
      {
        id: "emp-" + 50,
        name: "ANA BEATRIZ LIMA",
        status: "INSS",
        matricula: "00000813",
        originalDeptId: "formacao",
      },
      {
        id: "emp-" + 51,
        name: "CAMILE MOREIRA",
        status: "ATM",
        matricula: "00000814",
        originalDeptId: "recepcao",
      },
      {
        id: "emp-" + 53,
        name: "MARCO POLO SOUZA",
        status: "FÉRIAS",
        matricula: "00000815",
        originalDeptId: "recepcao",
      },
      {
        id: "emp-" + 54,
        name: "ADRYELLEN VIEIRA",
        status: "FÉRIAS",
        matricula: "00000816",
        originalDeptId: "classificacao",
      },
      {
        id: "emp-" + 55,
        name: "LARISSA DIAS",
        status: "FORA",
        matricula: "00000817",
        originalDeptId: "formacao",
      },
    ],
  },
  {
    title: "INSS",
    items: [
      {
        id: "emp-" + 57,
        name: "EDNELSON MELO",
        status: "INSS",
        matricula: "00002801",
        originalDeptId: "recepcao",
      },
    ],
  },
];
