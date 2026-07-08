import { jsPDF } from "jspdf";
import { ScanResult } from "../types";

/**
 * Generates and downloads a highly polished, professional cyber security assessment report in PDF format.
 * @param result The ScanResult data to populate the report
 */
export const generatePdfReport = (result: ScanResult): void => {
  try {
    // 1. Initialise jsPDF in A4, Portrait mode (210mm x 297mm)
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2; // 170mm

    let yPos = 25; // Current vertical cursor position
    let pageCount = 1;

    // Helper: Safely get text or return "Not Available"
    const getSafeText = (text: string | undefined | null): string => {
      return text && text.trim() ? text.trim() : "Not Available";
    };

    // Helper: Draw professional footer on the current page
    const drawFooter = (pageNum: number) => {
      // Divider line above footer
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.2);
      doc.line(margin, pageHeight - 22, pageWidth - margin, pageHeight - 22);

      // Disclaimer text
      doc.setFont("helvetica", "oblique");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139); // slate-500
      const footerText = "This report is AI-generated and should be used as a security assessment, not as legal or financial advice.";
      const wrappedFooter = doc.splitTextToSize(footerText, contentWidth - 20);
      
      doc.text(wrappedFooter, margin, pageHeight - 17, { align: "left" });

      // Page numbers
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(`Page ${pageNum}`, pageWidth - margin, pageHeight - 15, { align: "right" });
    };

    // Helper: Handle page breaks programmatically
    const checkPageBreak = (neededHeight: number): void => {
      if (yPos + neededHeight > pageHeight - 25) {
        drawFooter(pageCount);
        doc.addPage();
        pageCount++;
        yPos = 25; // Reset cursor for the new page
        drawHeader();
      }
    };

    // Helper: Draw top header (Only decorative top bar + app branding on successive pages)
    const drawHeader = () => {
      // Tech-grid decorative bar at top
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(margin, yPos - 10, contentWidth, 2, "F");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(124, 58, 237); // Purple accent
      doc.text("AI SCAM DETECTOR // SECURITY RESOLUTION LAB", margin, yPos - 4);
      yPos += 4;
    };

    // --- PAGE 1 START ---
    // Top decorative bar and branding
    drawHeader();
    yPos += 5;

    // Main Report Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text("AI Security Scan Report", margin, yPos);
    yPos += 8;

    // Timestamp & Ledger metadata
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // slate-500
    const nowStr = new Date().toLocaleString("en-US", {
      dateStyle: "long",
      timeStyle: "medium",
    });
    doc.text(`Generated: ${nowStr} (Local Time)`, margin, yPos);
    yPos += 12;

    // --- METRICS METADATA BOX (Grid layout) ---
    checkPageBreak(35);
    const boxHeight = 28;
    // Box background
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.3);
    doc.rect(margin, yPos, contentWidth, boxHeight, "FD");

    // Risk Index & Color indicators
    const riskScore = result.riskScore;
    let threatLevel = "SAFE";
    let statusColor = [16, 185, 129]; // emerald-500
    if (riskScore > 75) {
      threatLevel = "DANGEROUS";
      statusColor = [239, 68, 68]; // red-500
    } else if (riskScore > 30) {
      threatLevel = "SUSPICIOUS";
      statusColor = [245, 158, 11]; // amber-500
    }

    // Col 1: Threat Status
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text("THREAT INDEX STATUS", margin + 8, yPos + 8);
    
    // Status text in corresponding color
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.text(`${threatLevel} (${riskScore}%)`, margin + 8, yPos + 15);

    // Col 2: Category
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text("DETECTION CATEGORY", margin + 70, yPos + 8);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42); // slate-900
    const categoryText = getSafeText(result.details?.threatType || result.details?.impersonationTarget);
    doc.text(categoryText, margin + 70, yPos + 15);

    // Col 3: Confidence
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text("AI CONFIDENCE", margin + 130, yPos + 8);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(124, 58, 237); // Purple accent
    doc.text(`${result.confidence || "MEDIUM"}`, margin + 130, yPos + 15);

    yPos += boxHeight + 10;

    // --- SECTION: SUMMARY ---
    checkPageBreak(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text("Threat Summary & Technical Audit", margin, yPos);
    yPos += 5;

    // Divider line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85); // slate-700
    
    const summaryText = getSafeText(result.details?.explanation);
    const wrappedSummary = doc.splitTextToSize(summaryText, contentWidth);
    
    wrappedSummary.forEach((line: string) => {
      checkPageBreak(6);
      doc.text(line, margin, yPos);
      yPos += 5.5;
    });
    yPos += 6;

    // --- SECTION: MITIGATION RECOMMENDATION ---
    checkPageBreak(35);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("Defensive System Mitigation Recommendation", margin, yPos);
    yPos += 5;

    // Divider line
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 6;

    // Highlight Box for Recommendation
    const recText = getSafeText(result.recommendation);
    const wrappedRec = doc.splitTextToSize(recText, contentWidth - 12);
    const recBoxHeight = (wrappedRec.length * 6) + 10;
    
    checkPageBreak(recBoxHeight + 4);
    
    // Colored background matching status
    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2], 0.05); // light tint
    doc.setDrawColor(statusColor[0], statusColor[1], statusColor[2], 0.2);
    doc.setLineWidth(0.3);
    doc.rect(margin, yPos, contentWidth, recBoxHeight, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    
    let textY = yPos + 7;
    wrappedRec.forEach((line: string) => {
      doc.text(line, margin + 6, textY);
      textY += 5.5;
    });

    yPos += recBoxHeight + 10;

    // --- SECTION: THREAT FLAGS TRIGGERED ---
    if (result.reasons && result.reasons.length > 0) {
      checkPageBreak(30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text("Threat Flags Triggered", margin, yPos);
      yPos += 5;

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);

      result.reasons.forEach((reason) => {
        const bulletText = `•  ${reason}`;
        const wrappedBullet = doc.splitTextToSize(bulletText, contentWidth - 5);
        
        checkPageBreak(wrappedBullet.length * 6 + 4);
        
        wrappedBullet.forEach((line: string, index: number) => {
          // Indent successive lines of the bullet
          const bulletIndent = index === 0 ? margin : margin + 4;
          doc.text(line, bulletIndent, yPos);
          yPos += 5.5;
        });
        yPos += 2; // Spacing between reasons
      });
      yPos += 6;
    }

    // --- SECTION: ORIGINAL INPUT ---
    checkPageBreak(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("Original Scanned Input Parameters", margin, yPos);
    yPos += 5;

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 6;

    // Render input box with grey backdrop
    const rawInputText = getSafeText(result.scannedText);
    const wrappedInput = doc.splitTextToSize(rawInputText, contentWidth - 10);
    const inputBoxHeight = (wrappedInput.length * 5) + 10;

    checkPageBreak(inputBoxHeight + 5);

    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.rect(margin, yPos, contentWidth, inputBoxHeight, "FD");

    // Monospace or Courier looks nice for the code/original input text
    doc.setFont("courier", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105); // slate-600

    let inputY = yPos + 7;
    wrappedInput.forEach((line: string) => {
      doc.text(line, margin + 5, inputY);
      inputY += 5;
    });

    yPos += inputBoxHeight + 10;

    // --- DRAW LAST PAGE FOOTER ---
    drawFooter(pageCount);

    // --- SAVE AND DOWNLOAD ---
    // Format date: YYYY-MM-DD
    const isoDateStr = new Date().toISOString().split("T")[0];
    const filename = `scan-report-${isoDateStr}.pdf`;
    doc.save(filename);

  } catch (error) {
    console.error("PDF generation failed:", error);
    throw error;
  }
};
