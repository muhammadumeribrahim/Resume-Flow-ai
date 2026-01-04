import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from "docx";
import { saveAs } from "file-saver";
import { ResumeData } from "@/types/resume";
import { formatDate } from "./resumeUtils";

export const generatePDF = (data: ResumeData): void => {
  const doc = new jsPDF({
    unit: "pt",
    format: "letter",
  });

  const margin = 50;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;

  const lineHeight = 14;
  const sectionGap = 18;
  const bulletIndent = 15;

  // Helper to add text with word wrap
  const addText = (text: string, fontSize: number, isBold = false, indent = 0) => {
    doc.setFontSize(fontSize);
    doc.setFont("times", isBold ? "bold" : "normal");
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

  // Header - Name
  doc.setFontSize(16);
  doc.setFont("times", "bold");
  doc.text(data.personalInfo.fullName.toUpperCase(), pageWidth / 2, yPos, { align: "center" });
  yPos += 18;

  // Contact info
  const contactParts = [
    data.personalInfo.email,
    data.personalInfo.phone,
    data.personalInfo.location,
    data.personalInfo.linkedin,
  ].filter(Boolean);
  doc.setFontSize(10);
  doc.setFont("times", "normal");
  doc.text(contactParts.join(" | "), pageWidth / 2, yPos, { align: "center" });
  yPos += sectionGap;

  // Section helper
  const addSection = (title: string) => {
    yPos += 6;
    doc.setFontSize(12);
    doc.setFont("times", "bold");
    doc.text(title.toUpperCase(), margin, yPos);
    yPos += 2;
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += lineHeight;
  };

  // Professional Summary
  if (data.summary) {
    addSection("Professional Summary");
    addText(data.summary, 10);
    yPos += 6;
  }

  // Skills
  if (data.skills.length > 0 && data.skills.some(Boolean)) {
    addSection("Skills");
    addText(data.skills.filter(Boolean).join(" • "), 10);
    yPos += 6;
  }

  // Experience
  if (data.experience.length > 0) {
    addSection("Professional Experience");
    data.experience.forEach((exp) => {
      // Job title and dates
      doc.setFontSize(11);
      doc.setFont("times", "bold");
      const dates = `${formatDate(exp.startDate)} – ${exp.current ? "Present" : formatDate(exp.endDate)}`;
      doc.text(exp.jobTitle, margin, yPos);
      doc.setFont("times", "normal");
      doc.text(dates, pageWidth - margin, yPos, { align: "right" });
      yPos += lineHeight;

      // Company and location
      doc.setFontSize(10);
      doc.setFont("times", "italic");
      doc.text(`${exp.company}${exp.location ? `, ${exp.location}` : ""}`, margin, yPos);
      yPos += lineHeight;

      // Bullets
      doc.setFont("times", "normal");
      exp.bullets.filter(Boolean).forEach((bullet) => {
        addText(`• ${bullet}`, 10, false, bulletIndent);
      });
      yPos += 8;
    });
  }

  // Education
  if (data.education.length > 0) {
    addSection("Education");
    data.education.forEach((edu) => {
      doc.setFontSize(11);
      doc.setFont("times", "bold");
      doc.text(edu.degree, margin, yPos);
      doc.setFont("times", "normal");
      doc.text(formatDate(edu.graduationDate), pageWidth - margin, yPos, { align: "right" });
      yPos += lineHeight;

      doc.setFontSize(10);
      let eduDetails = edu.institution;
      if (edu.location) eduDetails += `, ${edu.location}`;
      if (edu.gpa) eduDetails += ` | GPA: ${edu.gpa}`;
      doc.text(eduDetails, margin, yPos);
      yPos += lineHeight + 4;
    });
  }

  // Save
  const fileName = `${data.personalInfo.fullName.replace(/\s+/g, "_")}_Resume.pdf`;
  doc.save(fileName);
};

export const generateDOCX = async (data: ResumeData): Promise<void> => {
  const children: Paragraph[] = [];

  // Name
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: data.personalInfo.fullName.toUpperCase(),
          bold: true,
          size: 32,
          font: "Times New Roman",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    })
  );

  // Contact info
  const contactParts = [
    data.personalInfo.email,
    data.personalInfo.phone,
    data.personalInfo.location,
    data.personalInfo.linkedin,
  ].filter(Boolean);

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: contactParts.join(" | "),
          size: 20,
          font: "Times New Roman",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
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
            size: 24,
            font: "Times New Roman",
          }),
        ],
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
        },
        spacing: { before: 240, after: 120 },
      })
    );
  };

  // Professional Summary
  if (data.summary) {
    addSectionHeader("Professional Summary");
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: data.summary,
            size: 20,
            font: "Times New Roman",
          }),
        ],
        spacing: { after: 120 },
      })
    );
  }

  // Skills
  if (data.skills.length > 0 && data.skills.some(Boolean)) {
    addSectionHeader("Skills");
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: data.skills.filter(Boolean).join(" • "),
            size: 20,
            font: "Times New Roman",
          }),
        ],
        spacing: { after: 120 },
      })
    );
  }

  // Experience
  if (data.experience.length > 0) {
    addSectionHeader("Professional Experience");
    data.experience.forEach((exp) => {
      // Title and dates
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: exp.jobTitle,
              bold: true,
              size: 22,
              font: "Times New Roman",
            }),
            new TextRun({
              text: `\t${formatDate(exp.startDate)} – ${exp.current ? "Present" : formatDate(exp.endDate)}`,
              size: 20,
              font: "Times New Roman",
            }),
          ],
          tabStops: [{ type: "right", position: 9000 }],
        })
      );

      // Company
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${exp.company}${exp.location ? `, ${exp.location}` : ""}`,
              italics: true,
              size: 20,
              font: "Times New Roman",
            }),
          ],
          spacing: { after: 80 },
        })
      );

      // Bullets
      exp.bullets.filter(Boolean).forEach((bullet) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `• ${bullet}`,
                size: 20,
                font: "Times New Roman",
              }),
            ],
            indent: { left: 360 },
          })
        );
      });

      children.push(new Paragraph({ spacing: { after: 120 } }));
    });
  }

  // Education
  if (data.education.length > 0) {
    addSectionHeader("Education");
    data.education.forEach((edu) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: edu.degree,
              bold: true,
              size: 22,
              font: "Times New Roman",
            }),
            new TextRun({
              text: `\t${formatDate(edu.graduationDate)}`,
              size: 20,
              font: "Times New Roman",
            }),
          ],
          tabStops: [{ type: "right", position: 9000 }],
        })
      );

      let eduDetails = edu.institution;
      if (edu.location) eduDetails += `, ${edu.location}`;
      if (edu.gpa) eduDetails += ` | GPA: ${edu.gpa}`;

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: eduDetails,
              size: 20,
              font: "Times New Roman",
            }),
          ],
          spacing: { after: 120 },
        })
      );
    });
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720,
            },
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
