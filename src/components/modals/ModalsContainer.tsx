import React from "react";
import { AdminPasswordModal } from "./AdminPasswordModal";
import { AdminModal } from "./AdminModal";
import { ConfirmBiometricModal } from "./ConfirmBiometricModal";
import { AddUserModal } from "./AddUserModal";
import { ImportEmployeeModal } from "./ImportEmployeeModal";
import { HistoryModal } from "./HistoryModal";
import { AuditLogModal } from "./AuditLogModal";
import { ReportModal } from "./ReportModal";
import { ManageAdminsModal } from "./ManageAdminsModal";
import { AddAdminModal } from "./AddAdminModal";
import { EditAdminModal } from "./EditAdminModal";

export function ModalsContainer(props: any) {
  return (
    <>
      <AdminPasswordModal
        isOpen={props.isChangePasswordModalOpen}
        onClose={props.closeChangePasswordModal}
        onChangePassword={props.handleChangeAdminPassword}
      />
      <AdminModal
        isOpen={props.isAdminModalOpen}
        onClose={props.closeAdminModal}
        {...props.adminModalProps}
      />
      <ConfirmBiometricModal
        isOpen={props.isConfirmBiometricModalOpen}
        onClose={props.closeConfirmBiometricModal}
        onActivate={props.handleActivateBiometrics}
        scale={1}
      />
      <AddUserModal
        isOpen={props.isAddUserModalOpen}
        onClose={props.closeAddUserModal}
        onAddUser={props.handleAddUser}

        isDarkMode={props.isDarkMode}
        onBack={props.onAddUserBack}
      />
      <ImportEmployeeModal
        isOpen={props.isImportModalOpen}
        onClose={props.closeImportModal}
        onImport={props.handleImportSelected}

        isDarkMode={props.isDarkMode}
        onBack={props.onImportBack}
      />
      <AuditLogModal
        isOpen={props.isAuditLogModalOpen}
        onClose={props.closeAuditLogModal}
        logs={props.movementLogs}
        isDarkMode={props.isDarkMode}
        onBack={props.onAuditLogBack}
      />
      <HistoryModal
        isOpen={props.isHistoryModalOpen}
        onClose={props.closeHistoryModal}
        scale={1}
        turma={null}
        showNotification={() => {}}
        currentLiveHistory={null}
        adminEmail={props.adminEmail}
        administrators={props.administrators}

        onBack={props.onHistoryBack}
      />
      <ReportModal
        isOpen={props.isReportModalOpen}
        onClose={props.closeReportModal}
        reportText={props.reportText}
        stats={props.stats}

        isDarkMode={props.isDarkMode}
        onBack={props.onReportBack}
      />
      <ManageAdminsModal
        isOpen={props.isManageAdminsModalOpen}
        onClose={props.closeManageAdminsModal}
        onBack={props.onManageAdminsBack}
        administrators={props.administrators || []}
        currentAdminEmail={props.adminEmail}
        onOpenAddAdmin={props.onOpenAddAdmin}
        onOpenEditAdmin={props.onOpenEditAdmin}
        onDeleteAdmin={props.onDeleteAdmin}
        isDarkMode={props.isDarkMode}
      />
      <AddAdminModal
        isOpen={props.isAddAdminModalOpen}
        onClose={props.closeAddAdminModal}
        onBack={props.onAddAdminBack}
        onAddAdmin={props.handleAddAdmin}
        isDarkMode={props.isDarkMode}
      />
      <EditAdminModal
        isOpen={props.isEditAdminModalOpen}
        onClose={props.closeEditAdminModal}
        onBack={props.onEditAdminBack}
        admin={props.adminToEdit}
        onEditAdmin={props.handleEditAdmin}
        isDarkMode={props.isDarkMode}
      />
    </>
  );
}
