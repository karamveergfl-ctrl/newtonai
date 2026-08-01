import jsPDF from "jspdf";

export interface CredentialInput {
  institutionName: string;
  boardName: string;
  activationCode: string;
}

/** Printable A5 landscape credential card for a classroom SmartBoard. */
export function generateCredentialPDF({ institutionName, boardName, activationCode }: CredentialInput) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a5" });
  const W = 210;
  const H = 148;

  doc.setFillColor(10, 22, 40);
  doc.rect(0, 0, W, H, "F");

  // Left panel
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("NewtonAI", 14, 28);
  doc.setFontSize(13);
  doc.text("SmartBoard", 14, 37);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text("Powered by AI · Built for Classrooms", 14, 45);

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(doc.splitTextToSize(institutionName, 68), 14, 62);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(203, 213, 225);
  doc.text(boardName, 14, 78);

  // Right teal panel
  doc.setFillColor(13, 148, 136);
  doc.roundedRect(88, 18, 108, 92, 4, 4, "F");

  doc.setTextColor(209, 250, 229);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("ACTIVATION CODE", 98, 36);

  doc.setTextColor(255, 255, 255);
  doc.setFont("courier", "bold");
  doc.setFontSize(26);
  doc.text(activationCode, 98, 52);

  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.3);
  doc.line(98, 62, 186, 62);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(209, 250, 229);
  doc.text("Enter this code once on the classroom board.", 98, 74);
  doc.text("The board stays signed in afterwards —", 98, 82);
  doc.text("no password is needed again.", 98, 90);

  // Bottom strip
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.text("Activate at: newtonai.site/smartboard/activate", 14, 126);
  doc.text("Support: support@newtonai.site", 14, 133);
  doc.text("This card is confidential — do not share with students.", 14, 140);

  doc.save(`NewtonAI-SmartBoard-${boardName.replace(/[^a-z0-9]+/gi, "-")}.pdf`);
}