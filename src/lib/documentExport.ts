import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle, TabStopType, TabStopPosition } from "docx";
import { saveAs } from "file-saver";
import { ResumeData } from "@/types/resume";
import { formatDateFull } from "./resumeUtils";

export const generatePDF = (data: ResumeData): void => {
  const doc = new jsPDF({
    unit: "pt",
    format: "letter",
  });

  const margin = 50;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;

  const lineHeight = 12;
  const sectionGap = 8;

  // Helper to add wrapped text
  const addWrappedText = (text: string, fontSize: number, isBold = false, isItalic = false, indent = 0) => {
    doc.setFontSize(fontSize);
    const fontStyle = isBold ? (isItalic ? "bolditalic" : "bold") : (isItalic ? "italic" : "normal");
    doc.setFont("times", fontStyle);
    const lines = doc.splitTextToSize(text, contentWidth - indent);
    lines.forEach((line: string) => {
      if (yPos > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        yPos = margin;
      }
      doc.text(line, margin + indent, yPos);
      yPos += lineHeight;
    });
  };

  // Section header with gold underline
  const addSectionHeader = (title: string) => {
    yPos += 6;
    doc.setFontSize(11);
    doc.setFont("times", "bold");
    doc.text(title.toUpperCase(), margin, yPos);
    yPos += 3;
    doc.setDrawColor(197, 160, 0); // Gold color
    doc.setLineWidth(1.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += lineHeight;
  };

  // Header - Name (centered)
  doc.setFontSize(18);
  doc.setFont("times", "bold");
  doc.text(data.personalInfo.fullName.toUpperCase(), pageWidth / 2, yPos, { align: "center" });
  yPos += 16;

  // Contact info (centered)
  const contactParts = [
    data.personalInfo.location,
    data.personalInfo.phone,
    data.personalInfo.email,
    data.personalInfo.github,
    data.personalInfo.portfolio,
    data.personalInfo.linkedin,
  ].filter(Boolean);
  doc.setFontSize(9);
  doc.setFont("times", "normal");
  doc.text(contactParts.join(" | "), pageWidth / 2, yPos, { align: "center" });
  yPos += sectionGap + 4;

  // Summary
  if (data.summary) {
    addSectionHeader("Summary");
    addWrappedText(data.summary, 10);
    yPos += 4;
  }

  // Core Strengths
  if (data.coreStrengths && data.coreStrengths.length > 0 && data.coreStrengths.some(c => c.category && c.skills)) {
    addSectionHeader("Core Strengths");
    data.coreStrengths.filter(c => c.category && c.skills).forEach((cat) => {
      doc.setFontSize(10);
      doc.setFont("times", "bold");
      const categoryText = `• ${cat.category}: `;
      doc.text(categoryText, margin, yPos);
      const categoryWidth = doc.getTextWidth(categoryText);
      doc.setFont("times", "normal");
      const skillLines = doc.splitTextToSize(cat.skills, contentWidth - categoryWidth);
      doc.text(skillLines[0], margin + categoryWidth, yPos);
      yPos += lineHeight;
      if (skillLines.length > 1) {
        for (let i = 1; i < skillLines.length; i++) {
          doc.text(skillLines[i], margin + 12, yPos);
          yPos += lineHeight;
        }
      }
    });
    yPos += 4;
  }

  // Experience
  if (data.experience.length > 0) {
    addSectionHeader("Experience");
    data.experience.forEach((exp) => {
      // Company and dates
      doc.setFontSize(11);
      doc.setFont("times", "bold");
      doc.text(exp.company, margin, yPos);
      doc.setFont("times", "normal");
      const dates = `${formatDateFull(exp.startDate)} - ${exp.current ? "Present" : formatDateFull(exp.endDate)}`;
      doc.text(dates, pageWidth - margin, yPos, { align: "right" });
      yPos += lineHeight;

      // Job title and location
      doc.setFontSize(10);
      doc.setFont("times", "italic");
      doc.text(exp.jobTitle, margin, yPos);
      const locationText = `${exp.location}${exp.workType ? ` | ${exp.workType}` : ""}`;
      doc.text(locationText, pageWidth - margin, yPos, { align: "right" });
      yPos += lineHeight;

      // Bullets
      doc.setFont("times", "normal");
      exp.bullets.filter(Boolean).forEach((bullet) => {
        const bulletText = `• ${bullet}`;
        const lines = doc.splitTextToSize(bulletText, contentWidth - 10);
        lines.forEach((line: string, idx: number) => {
          if (yPos > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            yPos = margin;
          }
          doc.text(line, margin + (idx > 0 ? 8 : 0), yPos);
          yPos += lineHeight;
        });
      });
      yPos += 6;
    });
  }

  // Education
  if (data.education.length > 0) {
    addSectionHeader("Education");
    data.education.forEach((edu) => {
      doc.setFontSize(11);
      doc.setFont("times", "bold");
      doc.text(edu.institution, margin, yPos);
      doc.setFont("times", "normal");
      if (edu.graduationDate) {
        doc.text(formatDateFull(edu.graduationDate), pageWidth - margin, yPos, { align: "right" });
      }
      yPos += lineHeight;

      doc.setFontSize(10);
      let degreeText = edu.degree;
      if (edu.field) degreeText += ` in ${edu.field}`;
      if (edu.gpa) degreeText += ` | GPA: ${edu.gpa}`;
      doc.text(degreeText, margin, yPos);
      yPos += lineHeight + 4;
    });
  }

  // Save
  const fileName = `${data.personalInfo.fullName.replace(/\s+/g, "_")}_Resume.pdf`;
  doc.save(fileName);
};

export const generateDOCX = async (data: ResumeData): Promise<void> => {
  const children: Paragraph[] = [];
  const goldBorder = { bottom: { style: BorderStyle.SINGLE, size: 12, color: "C5A000" } };

  // Name
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: data.personalInfo.fullName.toUpperCase(),
          bold: true,
          size: 36,
          font: "Times New Roman",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
    })
  );

  // Contact info
  const contactParts = [
    data.personalInfo.location,
    data.personalInfo.phone,
    data.personalInfo.email,
    data.personalInfo.github,
    data.personalInfo.portfolio,
    data.personalInfo.linkedin,
  ].filter(Boolean);

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: contactParts.join(" | "),
          size: 18,
          font: "Times New Roman",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
    })
  );

  // Section helper
  const addSectionHeader = (title: string) => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: title.toUpperCase(),
            bold: true,
            size: 22,
            font: "Times New Roman",
          }),
        ],
        border: goldBorder,
        spacing: { before: 160, after: 100 },
      })
    );
  };

  // Summary
  if (data.summary) {
    addSectionHeader("Summary");
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: data.summary,
            size: 20,
            font: "Times New Roman",
          }),
        ],
        spacing: { after: 80 },
      })
    );
  }

  // Core Strengths
  if (data.coreStrengths && data.coreStrengths.length > 0 && data.coreStrengths.some(c => c.category && c.skills)) {
    addSectionHeader("Core Strengths");
    data.coreStrengths.filter(c => c.category && c.skills).forEach((cat) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: "• ", size: 20, font: "Times New Roman" }),
            new TextRun({ text: `${cat.category}: `, bold: true, size: 20, font: "Times New Roman" }),
            new TextRun({ text: cat.skills, size: 20, font: "Times New Roman" }),
          ],
          spacing: { after: 40 },
        })
      );
    });
  }

  // Experience
  if (data.experience.length > 0) {
    addSectionHeader("Experience");
    data.experience.forEach((exp) => {
      // Company and dates
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: exp.company, bold: true, size: 22, font: "Times New Roman" }),
            new TextRun({ text: `\t${formatDateFull(exp.startDate)} - ${exp.current ? "Present" : formatDateFull(exp.endDate)}`, size: 20, font: "Times New Roman" }),
          ],
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        })
      );

      // Title and location
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: exp.jobTitle, italics: true, size: 20, font: "Times New Roman" }),
            new TextRun({ text: `\t${exp.location}${exp.workType ? ` | ${exp.workType}` : ""}`, italics: true, size: 20, font: "Times New Roman" }),
          ],
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          spacing: { after: 60 },
        })
      );

      // Bullets
      exp.bullets.filter(Boolean).forEach((bullet) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `• ${bullet}`, size: 20, font: "Times New Roman" }),
            ],
            indent: { left: 180 },
            spacing: { after: 20 },
          })
        );
      });

      children.push(new Paragraph({ spacing: { after: 100 } }));
    });
  }

  // Education
  if (data.education.length > 0) {
    addSectionHeader("Education");
    data.education.forEach((edu) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: edu.institution, bold: true, size: 22, font: "Times New Roman" }),
            new TextRun({ text: edu.graduationDate ? `\t${formatDateFull(edu.graduationDate)}` : "", size: 20, font: "Times New Roman" }),
          ],
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        })
      );

      let degreeText = edu.degree;
      if (edu.field) degreeText += ` in ${edu.field}`;
      if (edu.gpa) degreeText += ` | GPA: ${edu.gpa}`;

      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: degreeText, size: 20, font: "Times New Roman" }),
          ],
          spacing: { after: 80 },
        })
      );
    });
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `${data.personalInfo.fullName.replace(/\s+/g, "_")}_Resume.docx`;
  saveAs(blob, fileName);
};
