import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Department } from "../types";

export const generateDailyReportPDF = (departmentsData: Department[]) => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.setTextColor(40);
  doc.text("RELATÓRIO DIÁRIO", 14, 22);

  doc.setFontSize(10);
  doc.setTextColor(100);
  const dateFormatted = new Date()
    .toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    .toUpperCase();
  doc.text(dateFormatted, 14, 30);

  let startY = 40;

  departmentsData.forEach((dept) => {
    const activeData = dept.data.filter((emp) => emp.name.trim() !== "");
    if (activeData.length === 0) return;

    let headerColor: [number, number, number] = [94, 92, 230];
    if (
      dept.id.toLowerCase() === "recepcao" ||
      dept.id.toLowerCase() === "recepção"
    )
      headerColor = [10, 132, 255];
    if (
      dept.id.toLowerCase() === "classificacao" ||
      dept.id.toLowerCase() === "classificação"
    )
      headerColor = [255, 159, 10];
    if (
      dept.id.toLowerCase() === "formacao" ||
      dept.id.toLowerCase() === "formação"
    )
      headerColor = [48, 209, 88];

    autoTable(doc, {
      startY,
      head: [[dept.title.toUpperCase(), "LINHA", "LOCO"]],
      body: activeData.map((emp) => {
        const matricula = emp.matricula
          ? `(MAT: ${emp.matricula})`
          : "(MAT: S/N)";
        return [
          `${emp.name.toUpperCase()}\n${matricula}`,
          emp.line ? emp.line.toUpperCase() : "---",
          emp.machine ? emp.machine.toUpperCase() : "---",
        ];
      }),
      styles: {
        fontSize: 10,
        cellPadding: 4,
        valign: "middle",
      },
      headStyles: {
        fillColor: headerColor,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 11,
      },
      columnStyles: {
        0: { cellWidth: 80, fontStyle: "bold" },
        1: { cellWidth: 40 },
        2: { cellWidth: 40 },
      },
      margin: { left: 14, right: 14 },
    });

    startY = (doc as any).lastAutoTable.finalY + 15;

    if (startY > 270) {
      doc.addPage();
      startY = 20;
    }
  });

  doc.save("relatorio_diario.pdf");
};
