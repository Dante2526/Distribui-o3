const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8').replace(/\r\n/g, '\n');

// Add imports
code = code.replace(
  'import { ModalsContainer } from "./components/modals/ModalsContainer";',
  'import { ModalsContainer } from "./components/modals/ModalsContainer";\nimport { useAdminAuth } from "./hooks/useAdminAuth";\nimport { useAppModals } from "./hooks/useAppModals";'
);

// Replace the states block
const startIndex = code.indexOf('  const [isAdmin, setIsAdmin] = useState(isMock);');
const endIndexStr = '  const [showErrorToast, setShowErrorToast] = useState(false);\n';
const endIndex = code.indexOf(endIndexStr);

if (startIndex !== -1 && endIndex !== -1) {
const replacement = `  const [activePage, setActivePage] = useState(() => {
    return localStorage.getItem("distribui-page") || "home";
  });
  const [administrators, setAdministrators] = useState<any[]>([]);

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
  } = useAppModals(setToast);

  const {
    isAdmin, adminUser,
    showLoginToast, showErrorToast,
    handleAdminLogin, handleAdminLogout, handleChangeAdminPassword,
    handleActivateBiometrics, handleAdminLoginError, handleCloseBiometricModal,
    handleAddAdmin, handleEditAdmin, handleDeleteAdmin
  } = useAdminAuth(isMock, setToast, setIsAdminModalOpen, setIsConfirmBiometricModalOpen, setIsAdminPasswordModalOpen, setAdministrators);
`;
code = code.substring(0, startIndex) + replacement + code.substring(endIndex + endIndexStr.length);
} else {
  console.log('could not find block');
}

// Delete handlers
const removeBlock = (startString, endString) => {
   const startIdx = code.indexOf(startString);
   if (startIdx === -1) { console.log('not found: ' + startString); return; }
   const endIdxRaw = code.indexOf(endString, startIdx);
   if (endIdxRaw === -1) { console.log('end not found for: ' + startString); return; }
   const endIdx = endIdxRaw + endString.length;
   code = code.substring(0, startIdx) + code.substring(endIdx);
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

removeBlock('  const handleChangeAdminPassword = async', '    }\n  };\n');
removeBlock('  const handleAdminLogin = useCallback(', '    [],\n  );\n');
removeBlock('  const handleAdminLogout = useCallback(() => {', '  }, []);\n');
removeBlock('  const handleCloseBiometricModal = useCallback(() => {', '  }, []);\n');
removeBlock('  const handleActivateBiometrics = useCallback(async () => {', '  }, [adminUser]);\n');
removeBlock('  const handleAdminLoginError = useCallback(() => {', '  }, []);\n');

fs.writeFileSync('src/App.tsx', code);
console.log('done');
