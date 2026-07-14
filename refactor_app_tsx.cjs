const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8').replace(/\r\n/g, '\n');

// 1. Add imports
code = code.replace(
  'import { useDragAndDrop } from "./hooks/useDragAndDrop";',
  'import { useDragAndDrop } from "./hooks/useDragAndDrop";\nimport { useAdminAuth } from "./hooks/useAdminAuth";\nimport { useAppModals } from "./hooks/useAppModals";'
);

// 2. Remove states specifically
const removeLineRegex = (regexStr) => {
    code = code.replace(new RegExp(regexStr), '');
};
removeLineRegex('  const \\[isAdmin, setIsAdmin\\] = useState\\(isMock\\);\\n');
removeLineRegex('  const \\[adminUser, setAdminUser\\] = useState[\\s\\S]*?\\n\\s*\\} \\| null>\\(isMock \\? \\{ name: "Mock Admin", email: "mock@admin.com" \\} : null\\);\\n');
removeLineRegex('  const \\[isAdminModalOpen, setIsAdminModalOpen\\] = useState\\(false\\);\\n');
removeLineRegex('  const \\[isAddUserModalOpen, setIsAddUserModalOpen\\] = useState\\(false\\);\\n');
removeLineRegex('  const \\[isImportModalOpen, setIsImportModalOpen\\] = useState\\(false\\);\\n');
removeLineRegex('  const \\[isAdminPasswordModalOpen, setIsAdminPasswordModalOpen\\] =[\\s\\S]*?useState\\(false\\);\\n');
removeLineRegex('  const \\[showLoginToast, setShowLoginToast\\] = useState\\(false\\);\\n');
removeLineRegex('  const \\[isHistoryModalOpen, setIsHistoryModalOpen\\] = useState\\(false\\);\\n');
removeLineRegex('  const \\[isAuditLogModalOpen, setIsAuditLogModalOpen\\] = useState\\(false\\);\\n');
removeLineRegex('  const \\[isReportModalOpen, setIsReportModalOpen\\] = useState\\(false\\);\\n');
removeLineRegex('  const \\[isConfirmBiometricModalOpen, setIsConfirmBiometricModalOpen\\] =[\\s\\S]*?useState\\(false\\);\\n');
removeLineRegex('  const \\[isManageAdminsModalOpen, setIsManageAdminsModalOpen\\] = useState\\(false\\);\\n');
removeLineRegex('  const \\[isAddAdminModalOpen, setIsAddAdminModalOpen\\] = useState\\(false\\);\\n');
removeLineRegex('  const \\[isEditAdminModalOpen, setIsEditAdminModalOpen\\] = useState\\(false\\);\\n');
removeLineRegex('  const \\[adminToEdit, setAdminToEdit\\] = useState<any \\| null>\\(null\\);\\n');
removeLineRegex('  const \\[reportContent, setReportContent\\] = useState\\(""\\);\\n');
removeLineRegex('  const \\[reportStats, setReportStats\\] = useState<[\\s\\S]*?\\} \\| null>\\(null\\);\\n');
removeLineRegex('  const \\[showErrorToast, setShowErrorToast\\] = useState\\(false\\);\\n');

// 3. Inject Hooks after showToastMessage
const showToastMessageEnd = '    [],\n  );';
const splitIdx = code.indexOf('const showToastMessage = useCallback');
if (splitIdx !== -1) {
    const endIdx = code.indexOf(showToastMessageEnd, splitIdx) + showToastMessageEnd.length;
    const hooksCode = `

  const {
    isAdminModalOpen, setIsAdminModalOpen,
    isAddUserModalOpen, setIsAddUserModalOpen,
    isImportModalOpen, setIsImportModalOpen,
    isAdminPasswordModalOpen, setIsAdminPasswordModalOpen,
    isHistoryModalOpen, setIsHistoryModalOpen,
    isAuditLogModalOpen, setIsAuditLogModalOpen,
    isReportModalOpen, setIsReportModalOpen,
    isConfirmBiometricModalOpen, setIsConfirmBiometricModalOpen,
    isManageAdminsModalOpen, setIsManageAdminsModalOpen,
    isAddAdminModalOpen, setIsAddAdminModalOpen,
    isEditAdminModalOpen, setIsEditAdminModalOpen,
    adminToEdit, setAdminToEdit,
    reportContent, setReportContent,
    reportStats, setReportStats,
    handleOpenManageAdmins,
    handleOpenAddAdmin,
    handleOpenEditAdmin,
    handleShowHistory,
    handleShowAuditLog,
    handleShowHelp,
    handleShowTutorial
  } = useAppModals(showToastMessage);

  const {
    isAdmin, adminUser,
    showLoginToast, showErrorToast,
    handleAdminLogin, handleAdminLogout, handleChangeAdminPassword,
    handleActivateBiometrics, handleAdminLoginError, handleCloseBiometricModal,
    handleAddAdmin, handleEditAdmin, handleDeleteAdmin
  } = useAdminAuth(isMock, showToastMessage, setIsAdminModalOpen, setIsConfirmBiometricModalOpen, setIsAdminPasswordModalOpen, setAdministrators);
`;
    code = code.substring(0, endIdx) + hooksCode + code.substring(endIdx);
} else {
    console.log("Could not find showToastMessage");
}

// 4. Remove Handlers
const removeBlock = (startString, endString) => {
   const startIdx = code.indexOf(startString);
   if (startIdx === -1) { console.log('not found: ' + startString); return; }
   const endIdx = code.indexOf(endString, startIdx);
   if (endIdx === -1) { console.log('end not found: ' + endString); return; }
   const actualEndIdx = endIdx + endString.length;
   code = code.substring(0, startIdx) + code.substring(actualEndIdx);
};

removeBlock('  const handleOpenManageAdmins = useCallback(async () => {', '  }, []);\n');
removeBlock('  const handleOpenAddAdmin = useCallback(() => {', '  }, []);\n');
removeBlock('  const handleOpenEditAdmin = useCallback(', '  }, [administrators]);\n');
removeBlock('  const handleDeleteAdmin = useCallback(', '  }, [showToastMessage]);\n');
removeBlock('  const handleAddAdmin = useCallback(', '  }, [showToastMessage]);\n');
removeBlock('  const handleEditAdmin = useCallback(', '  }, [showToastMessage]);\n');

removeBlock('  const handleShowHistory = useCallback(() => {', '  }, []);\n');
removeBlock('  const handleShowAuditLog = useCallback(() => {', '  }, []);\n');
removeBlock('  const handleShowHelp = useCallback(() => {', '  }, [showToastMessage]);\n');
removeBlock('  const handleShowTutorial = useCallback(() => {', '  }, [showToastMessage]);\n');

removeBlock('  const handleChangeAdminPassword = async (newPassword: string) => {', '    }\n  };\n');
removeBlock('  const handleAdminLogin = useCallback(', '    [],\n  );\n');
removeBlock('  const handleAdminLogout = useCallback(() => {', '  }, []);\n');
removeBlock('  const handleCloseBiometricModal = useCallback(() => {', '  }, []);\n');
removeBlock('  const handleActivateBiometrics = useCallback(async () => {', '  }, [adminUser]);\n');
removeBlock('  const handleAdminLoginError = useCallback(() => {', '  }, []);\n');

fs.writeFileSync('src/App.tsx', code);
console.log('Refactor script completed');
