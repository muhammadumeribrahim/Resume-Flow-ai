import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle, TabStopType, TabStopPosition, convertInchesToTwip, ExternalHyperlink } from "docx";
import { saveAs } from "file-saver";
import { ResumeData, ResumeFormat } from "@/types/resume";
import { formatDateFull } from "./resumeUtils";

// American standard resume format specifications
// Letter page: 8.5" x 11" = 612pt x 792pt
// Name: 21pt, Section headers: 12pt, Subheaders: 11pt, Body: 10pt
// Section spacing: 2pt, Entry spacing: 0pt, Line spacing: 12pt
// Top/bottom margin: 26pt, Side margins: 36pt

export const generatePDF = (data: ResumeData, format: ResumeFormat = 'standard'): void => {
  const doc = new jsPDF({
    unit: "pt",
    format: "letter", // 8.5" x 11"
  });

  // Margins
  const marginTop = 26;
  const marginBottom = 26;
  const marginSide = 36;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - marginSide * 2;
  
  // Font sizes
  const nameSize = format === 'compact' ? 18 : 21;
  const sectionSize = 12;
  const subheaderSize = 11;
  const bodySize = 10;
  const lineHeight = 12;
  const sectionSpacing = format === 'compact' ? 1 : 2;

  let yPos = marginTop;

  // Helper to check page break
  const checkPageBreak = (neededHeight: number = lineHeight) => {
    if (yPos + neededHeight > pageHeight - marginBottom) {
      doc.addPage();
      yPos = marginTop;
    }
  };

  // Helper to add wrapped text
  const addWrappedText = (text: string, fontSize: number, isBold = false, indent = 0) => {
    doc.setFontSize(fontSize);
    doc.setFont("times", isBold ? "bold" : "normal");
    const lines = doc.splitTextToSize(text, contentWidth - indent);
    lines.forEach((line: string) => {
      checkPageBreak();
      doc.text(line, marginSide + indent, yPos);
      yPos += lineHeight;
    });
  };

  // Section header with black underline
  const addSectionHeader = (title: string) => {
    yPos += sectionSpacing;
    checkPageBreak(lineHeight + 4);
    doc.setFontSize(sectionSize);
    doc.setFont("times", "bold");
    doc.text(title.toUpperCase(), marginSide, yPos);
    yPos += 2;
    doc.setDrawColor(0, 0, 0); // Black color
    doc.setLineWidth(0.5);
    doc.line(marginSide, yPos, pageWidth - marginSide, yPos);
    yPos += sectionSpacing + 2;
  };

  // Header - Name (centered)
  doc.setFontSize(nameSize);
  doc.setFont("times", "bold");
  doc.text(data.personalInfo.fullName.toUpperCase(), pageWidth / 2, yPos, { align: "center" });
  yPos += nameSize * 0.6;

  // Contact info (centered) - clickable labels for links
  const normalizeUrl = (url: string | undefined | null): string | null => {
    if (!url) return null;
    const trimmed = url.trim();
    if (!trimmed) return null;
    return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
  };

  const contactSegments: Array<{ text: string; url?: string }> = [];
  if (data.personalInfo.location) contactSegments.push({ text: data.personalInfo.location });
  if (data.personalInfo.phone) contactSegments.push({ text: data.personalInfo.phone });
  if (data.personalInfo.email) contactSegments.push({ text: data.personalInfo.email });

  const githubUrl = normalizeUrl(data.personalInfo.github);
  if (githubUrl) contactSegments.push({ text: "GitHub", url: githubUrl });

  const portfolioUrl = normalizeUrl(data.personalInfo.portfolio);
  if (portfolioUrl) contactSegments.push({ text: "Portfolio", url: portfolioUrl });

  const linkedinUrl = normalizeUrl(data.personalInfo.linkedin);
  if (linkedinUrl) contactSegments.push({ text: "LinkedIn", url: linkedinUrl });

  doc.setFontSize(bodySize);
  doc.setFont("times", "normal");

  const separator = " | ";
  const sepWidth = doc.getTextWidth(separator);
  const totalWidth =
    contactSegments.reduce((sum, seg) => sum + doc.getTextWidth(seg.text), 0) +
    (contactSegments.length > 1 ? sepWidth * (contactSegments.length - 1) : 0);

  let xPos = (pageWidth - totalWidth) / 2;
  contactSegments.forEach((seg, idx) => {
    if (idx > 0) {
      doc.text(separator, xPos, yPos);
      xPos += sepWidth;
    }

    if (seg.url) {
      doc.textWithLink(seg.text, xPos, yPos, { url: seg.url });
      doc.textWithLink(seg.text, xPos, yPos, { url: seg.url });
    } else {
      doc.text(seg.text, xPos, yPos);
    }

    xPos += doc.getTextWidth(seg.text);
  });

  yPos += lineHeight + sectionSpacing;

  // Summary
  if (data.summary) {
    addSectionHeader("Summary");
    addWrappedText(data.summary, bodySize);
    yPos += sectionSpacing;
  }

  // Core Strengths
  if (data.coreStrengths && data.coreStrengths.length > 0 && data.coreStrengths.some(c => c.category && c.skills)) {
    addSectionHeader("Core Strengths");
    data.coreStrengths.filter(c => c.category && c.skills).forEach((cat) => {
      checkPageBreak();
      doc.setFontSize(bodySize);
      doc.setFont("times", "bold");
      const categoryText = `• ${cat.category}: `;
      doc.text(categoryText, marginSide, yPos);
      const categoryWidth = doc.getTextWidth(categoryText);
      doc.setFont("times", "normal");
      const skillLines = doc.splitTextToSize(cat.skills, contentWidth - categoryWidth);
      doc.text(skillLines[0], marginSide + categoryWidth, yPos);
      yPos += lineHeight;
      if (skillLines.length > 1) {
        for (let i = 1; i < skillLines.length; i++) {
          checkPageBreak();
          doc.text(skillLines[i], marginSide + 12, yPos);
          yPos += lineHeight;
        }
      }
    });
    yPos += sectionSpacing;
  }

  // Experience
  if (data.experience.length > 0) {
    addSectionHeader("Experience");
    data.experience.forEach((exp) => {
      checkPageBreak(lineHeight * 3);
      
      // Company and dates - bold
      doc.setFontSize(subheaderSize);
      doc.setFont("times", "bold");
      doc.text(exp.company, marginSide, yPos);
      const dates = `${formatDateFull(exp.startDate)} - ${exp.current ? "Present" : formatDateFull(exp.endDate)}`;
      doc.setFontSize(bodySize);
      doc.text(dates, pageWidth - marginSide, yPos, { align: "right" });
      yPos += lineHeight;

      // Job title and location - bold
      doc.setFontSize(bodySize);
      doc.setFont("times", "bold");
      doc.text(exp.jobTitle, marginSide, yPos);
      const locationText = `${exp.location}${exp.workType ? ` | ${exp.workType}` : ""}`;
      doc.text(locationText, pageWidth - marginSide, yPos, { align: "right" });
      yPos += lineHeight;

      // Bullets - normal
      doc.setFont("times", "normal");
      exp.bullets.filter(Boolean).forEach((bullet) => {
        const bulletText = `• ${bullet}`;
        const lines = doc.splitTextToSize(bulletText, contentWidth - 10);
        lines.forEach((line: string, idx: number) => {
          checkPageBreak();
          doc.text(line, marginSide + (idx > 0 ? 8 : 0), yPos);
          yPos += lineHeight;
        });
      });
      yPos += sectionSpacing;
    });
  }

  // Education
  if (data.education.length > 0) {
    addSectionHeader("Education");
    data.education.forEach((edu) => {
      checkPageBreak(lineHeight * 2);
      doc.setFontSize(subheaderSize);
      doc.setFont("times", "bold");
      doc.text(edu.institution, marginSide, yPos);
      doc.setFontSize(bodySize);
      doc.setFont("times", "normal");
      if (edu.graduationDate) {
        doc.text(formatDateFull(edu.graduationDate), pageWidth - marginSide, yPos, { align: "right" });
      }
      yPos += lineHeight;

      doc.setFontSize(bodySize);
      let degreeText = edu.degree;
      if (edu.field) degreeText += ` in ${edu.field}`;
      if (edu.gpa) degreeText += ` | GPA: ${edu.gpa}`;
      doc.text(degreeText, marginSide, yPos);
      yPos += lineHeight + sectionSpacing;
    });
  }

  // Custom Sections
  if (data.customSections && data.customSections.length > 0) {
    data.customSections.filter(s => s.title).forEach((section) => {
      addSectionHeader(section.title);
      section.items.forEach((item) => {
        if (item.title) {
          checkPageBreak(lineHeight * 2);
          doc.setFontSize(subheaderSize);
          doc.setFont("times", "bold");
          doc.text(item.title, marginSide, yPos);
          if (item.date) {
            doc.setFontSize(bodySize);
            doc.setFont("times", "normal");
            doc.text(item.date, pageWidth - marginSide, yPos, { align: "right" });
          }
          yPos += lineHeight;

          if (item.subtitle) {
            doc.setFontSize(bodySize);
            doc.setFont("times", "normal");
            doc.text(item.subtitle, marginSide, yPos);
            yPos += lineHeight;
          }

          if (item.description) {
            addWrappedText(item.description, bodySize);
          }

          doc.setFont("times", "normal");
          item.bullets.filter(Boolean).forEach((bullet) => {
            const bulletText = `• ${bullet}`;
            const lines = doc.splitTextToSize(bulletText, contentWidth - 10);
            lines.forEach((line: string, idx: number) => {
              checkPageBreak();
              doc.text(line, marginSide + (idx > 0 ? 8 : 0), yPos);
              yPos += lineHeight;
            });
          });
          yPos += sectionSpacing;
        }
      });
    });
  }

  // Save
  const fileName = `${data.personalInfo.fullName.replace(/\s+/g, "_")}_Resume.pdf`;
  doc.save(fileName);
};

export const generateDOCX = async (data: ResumeData, format: ResumeFormat = 'standard'): Promise<void> => {
  const children: Paragraph[] = [];
  const blackBorder = { bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" } };
  
  // Font sizes in half-points (multiply pt by 2)
  const nameSize = format === 'compact' ? 36 : 42; // 18pt or 21pt
  const sectionSize = 24; // 12pt
  const subheaderSize = 22; // 11pt
  const bodySize = 20; // 10pt
  const sectionSpacing = format === 'compact' ? 20 : 40;

  // Name
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: data.personalInfo.fullName.toUpperCase(),
          bold: true,
          size: nameSize,
          font: "Times New Roman",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
    })
  );

  // Contact info - clickable labels for links
  const normalizeUrl = (url: string | undefined | null): string | null => {
    if (!url) return null;
    const trimmed = url.trim();
    if (!trimmed) return null;
    return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
  };

  const contactSegments: Array<{ text: string; url?: string }> = [];
  if (data.personalInfo.location) contactSegments.push({ text: data.personalInfo.location });
  if (data.personalInfo.phone) contactSegments.push({ text: data.personalInfo.phone });
  if (data.personalInfo.email) contactSegments.push({ text: data.personalInfo.email });

  const githubUrl = normalizeUrl(data.personalInfo.github);
  if (githubUrl) contactSegments.push({ text: "GitHub", url: githubUrl });

  const portfolioUrl = normalizeUrl(data.personalInfo.portfolio);
  if (portfolioUrl) contactSegments.push({ text: "Portfolio", url: portfolioUrl });

  const linkedinUrl = normalizeUrl(data.personalInfo.linkedin);
  if (linkedinUrl) contactSegments.push({ text: "LinkedIn", url: linkedinUrl });

  const contactChildren: Array<TextRun | ExternalHyperlink> = [];
  contactSegments.forEach((seg, idx) => {
    if (idx > 0) {
      contactChildren.push(new TextRun({ text: " | ", size: bodySize, font: "Times New Roman" }));
    }

    if (seg.url) {
      contactChildren.push(
        new ExternalHyperlink({
          link: seg.url,
          children: [
            new TextRun({
              text: seg.text,
              style: "Hyperlink",
              size: bodySize,
              font: "Times New Roman",
            }),
          ],
        })
      );
    } else {
      contactChildren.push(new TextRun({ text: seg.text, size: bodySize, font: "Times New Roman" }));
    }
  });

  children.push(
    new Paragraph({
      children: contactChildren,
      alignment: AlignmentType.CENTER,
      spacing: { after: sectionSpacing * 2 },
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
            size: sectionSize,
            font: "Times New Roman",
          }),
        ],
        border: blackBorder,
        spacing: { before: sectionSpacing * 2, after: sectionSpacing },
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
            size: bodySize,
            font: "Times New Roman",
          }),
        ],
        spacing: { after: sectionSpacing },
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
            new TextRun({ text: "• ", size: bodySize, font: "Times New Roman" }),
            new TextRun({ text: `${cat.category}: `, bold: true, size: bodySize, font: "Times New Roman" }),
            new TextRun({ text: cat.skills, size: bodySize, font: "Times New Roman" }),
          ],
          spacing: { after: 0 },
        })
      );
    });
  }

  // Experience
  if (data.experience.length > 0) {
    addSectionHeader("Experience");
    data.experience.forEach((exp) => {
      // Company and dates - bold
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: exp.company, bold: true, size: subheaderSize, font: "Times New Roman" }),
            new TextRun({ text: `\t${formatDateFull(exp.startDate)} - ${exp.current ? "Present" : formatDateFull(exp.endDate)}`, bold: true, size: bodySize, font: "Times New Roman" }),
          ],
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        })
      );

      // Title and location - bold
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: exp.jobTitle, bold: true, size: bodySize, font: "Times New Roman" }),
            new TextRun({ text: `\t${exp.location}${exp.workType ? ` | ${exp.workType}` : ""}`, bold: true, size: bodySize, font: "Times New Roman" }),
          ],
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          spacing: { after: 20 },
        })
      );

      // Bullets
      exp.bullets.filter(Boolean).forEach((bullet) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `• ${bullet}`, size: bodySize, font: "Times New Roman" }),
            ],
            indent: { left: 180 },
            spacing: { after: 0 },
          })
        );
      });

      children.push(new Paragraph({ spacing: { after: sectionSpacing } }));
    });
  }

  // Education
  if (data.education.length > 0) {
    addSectionHeader("Education");
    data.education.forEach((edu) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: edu.institution, bold: true, size: subheaderSize, font: "Times New Roman" }),
            new TextRun({ text: edu.graduationDate ? `\t${formatDateFull(edu.graduationDate)}` : "", size: bodySize, font: "Times New Roman" }),
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
            new TextRun({ text: degreeText, size: bodySize, font: "Times New Roman" }),
          ],
          spacing: { after: sectionSpacing },
        })
      );
    });
  }

  // Custom Sections
  if (data.customSections && data.customSections.length > 0) {
    data.customSections.filter(s => s.title).forEach((section) => {
      addSectionHeader(section.title);
      section.items.forEach((item) => {
        if (item.title) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: item.title, bold: true, size: subheaderSize, font: "Times New Roman" }),
                new TextRun({ text: item.date ? `\t${item.date}` : "", size: bodySize, font: "Times New Roman" }),
              ],
              tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            })
          );

          if (item.subtitle) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({ text: item.subtitle, size: bodySize, font: "Times New Roman" }),
                ],
              })
            );
          }

          if (item.description) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({ text: item.description, size: bodySize, font: "Times New Roman" }),
                ],
              })
            );
          }

          item.bullets.filter(Boolean).forEach((bullet) => {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({ text: `• ${bullet}`, size: bodySize, font: "Times New Roman" }),
                ],
                indent: { left: 180 },
                spacing: { after: 0 },
              })
            );
          });

          children.push(new Paragraph({ spacing: { after: sectionSpacing } }));
        }
      });
    });
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.36), // 26pt
              bottom: convertInchesToTwip(0.36),
              left: convertInchesToTwip(0.5), // 36pt
              right: convertInchesToTwip(0.5),
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
