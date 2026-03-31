import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const safeValue = (value, fallback = "N/A") => {
  if (value === null || value === undefined) {
    return fallback;
  }

  const text = String(value).trim();
  return text || fallback;
};

const formatDate = (value) => {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const formatStatus = (value) =>
  safeValue(value, "Pending")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const drawLabelValue = (doc, label, value, x, y, width) => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(95, 111, 124);
  doc.text(label, x, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(32, 48, 64);

  const wrappedValue = doc.splitTextToSize(safeValue(value), width);
  doc.text(wrappedValue, x, y + 14);
};

const openGeneratedPdf = (doc, fileName) => {
  const blobUrl = doc.output("bloburl");
  const preview = window.open(blobUrl, "_blank");

  if (!preview) {
    doc.save(fileName);
  }

  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
};

export const downloadPrescriptionPdf = (prescription) => {
  if (!prescription || typeof window === "undefined") {
    return;
  }

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 28;
  const contentWidth = pageWidth - margin * 2;

  const fileStem = safeValue(
    prescription.appointmentId,
    prescription._id || prescription.patientName || "prescription"
  ).replace(/[^a-z0-9-_]+/gi, "-");
  const fileName = `prescription-${fileStem}.pdf`;

  const hospitalName = safeValue(
    prescription.hospitalName,
    "MediSphere General Hospital"
  );
  const doctorTitle = safeValue(
    prescription.doctorTitle,
    "Consultant Physician"
  );
  const notes = safeValue(
    prescription.notes,
    "Continue as advised by the doctor"
  );

  doc.setDrawColor(127, 147, 167);
  doc.setLineWidth(1.3);
  doc.roundedRect(margin - 8, margin - 8, contentWidth + 16, pageHeight - margin * 2 + 16, 10, 10);

  doc.setFillColor(15, 39, 64);
  doc.rect(margin - 8, margin - 8, contentWidth + 16, 52, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("MEDISPHERE", margin + 12, margin + 22);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(hospitalName, pageWidth - margin - doc.getTextWidth(hospitalName), margin + 22);

  doc.setTextColor(21, 36, 52);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("Doctor Prescription", margin + 10, 102);

  const cardTop = 120;
  const cardGap = 12;
  const cardWidth = (contentWidth - cardGap) / 2;
  const cardHeight = 70;

  doc.setDrawColor(207, 216, 227);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, cardTop, cardWidth, cardHeight, 8, 8, "FD");
  doc.roundedRect(margin + cardWidth + cardGap, cardTop, cardWidth, cardHeight, 8, 8, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(32, 48, 64);
  doc.text("Patient Details", margin + 12, cardTop + 18);
  doc.text("Consultation Details", margin + cardWidth + cardGap + 12, cardTop + 18);

  drawLabelValue(doc, "Patient Name", prescription.patientName, margin + 12, cardTop + 34, 140);
  drawLabelValue(doc, "Patient ID", prescription.patientId, margin + 160, cardTop + 34, 110);
  drawLabelValue(doc, "Appointment ID", prescription.appointmentId, margin + cardWidth + cardGap + 12, cardTop + 34, 120);
  drawLabelValue(doc, "Issued Date", formatDate(prescription.issuedDate), margin + cardWidth + cardGap + 160, cardTop + 34, 120);

  const diagnosisTop = cardTop + cardHeight + 14;
  doc.roundedRect(margin, diagnosisTop, contentWidth, 78, 8, 8, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(32, 48, 64);
  doc.text("Diagnosis", margin + 12, diagnosisTop + 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const diagnosisLines = doc.splitTextToSize(safeValue(prescription.diagnosis), contentWidth - 24);
  doc.text(diagnosisLines, margin + 12, diagnosisTop + 38);

  const tableStartY = diagnosisTop + 96;
  autoTable(doc, {
    startY: tableStartY,
    margin: { left: margin, right: margin },
    head: [["Medicine Name", "Dosage", "Frequency", "Duration", "Instructions", "Notes", "Status"]],
    body: (Array.isArray(prescription.medicines) && prescription.medicines.length
      ? prescription.medicines
      : [{ medicineName: "-", dosage: "-", frequency: "-", duration: "-", instructions: "-" }]
    ).map((medicine) => [
      safeValue(medicine.medicineName),
      safeValue(medicine.dosage),
      safeValue(medicine.frequency),
      safeValue(medicine.duration),
      safeValue(medicine.instructions, "Take as directed"),
      notes,
      formatStatus(prescription.status),
    ]),
    headStyles: {
      fillColor: [237, 244, 248],
      textColor: [32, 48, 64],
      lineColor: [207, 216, 227],
      lineWidth: 0.6,
      fontStyle: "bold",
    },
    bodyStyles: {
      textColor: [32, 48, 64],
      lineColor: [207, 216, 227],
      lineWidth: 0.5,
      fontSize: 9,
      cellPadding: 6,
    },
    columnStyles: {
      0: { cellWidth: 78 },
      1: { cellWidth: 52 },
      2: { cellWidth: 60 },
      3: { cellWidth: 52 },
      4: { cellWidth: 86 },
      5: { cellWidth: 70 },
      6: { cellWidth: 58 },
    },
    styles: {
      overflow: "linebreak",
      valign: "middle",
    },
    didDrawPage: () => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(32, 48, 64);
      doc.text("Medicines", margin + 12, tableStartY - 10);
    },
  });

  const finalY = doc.lastAutoTable.finalY + 18;
  const footerCardWidth = (contentWidth - 12) / 2;
  const footerHeight = 92;

  doc.roundedRect(margin, finalY, footerCardWidth, footerHeight, 8, 8, "FD");
  doc.roundedRect(margin + footerCardWidth + 12, finalY, footerCardWidth, footerHeight, 8, 8, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Doctor Detail", margin + 12, finalY + 18);
  doc.text("Doctor Signature", margin + footerCardWidth + 24, finalY + 18);

  drawLabelValue(doc, "Doctor Name", prescription.doctorName, margin + 12, finalY + 36, 150);
  drawLabelValue(doc, "Title", doctorTitle, margin + 165, finalY + 36, 110);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(20);
  doc.setTextColor(22, 50, 74);
  doc.text(safeValue(prescription.doctorName, "Authorized Doctor"), margin + footerCardWidth + 40, finalY + 66);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(95, 111, 124);
  doc.text(`Prescription ID: ${safeValue(prescription._id, "Local record")}`, margin + 12, finalY + 82);
  doc.text("Digitally prepared by MediSphere", margin + footerCardWidth + 24, finalY + 82);

  openGeneratedPdf(doc, fileName);
};
