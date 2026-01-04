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

  // Section header with black underline (no overlap with body text)
  const addSectionHeader = (title: string) => {
    yPos += sectionSpacing;
    doc.setFontSize(sectionSize);
    doc.setFont("times", "bold");

    // Keep extra room so underline never collides with the next paragraph
    checkPageBreak(lineHeight * 2);

    const headerY = yPos;
    doc.text(title.toUpperCase(), marginSide, headerY);

    const underlineY = headerY + 4;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(marginSide, underlineY, pageWidth - marginSide, underlineY);

    // Start next text safely below the underline
    yPos = underlineY + lineHeight;
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

    // Remove accidental whitespace inside URLs (common copy/paste issue)
    const noSpaces = trimmed.replace(/\s+/g, "");
    const normalized = noSpaces.startsWith("http") ? noSpaces : `https://${noSpaces}`;

    try {
      // Validate URL; if invalid, skip link rather than breaking export
      // eslint-disable-next-line no-new
      new URL(normalized);
      return normalized;
    } catch {
      return null;
    }
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

  const addPdfLink = (text: string, url: string, x: number, y: number) => {
    const anyDoc = doc as unknown as {
      textWithLink?: (t: string, xx: number, yy: number, opts: { url: string }) => void;
      link?: (xx: number, yy: number, w: number, h: number, opts: { url: string }) => void;
    };

    if (typeof anyDoc.textWithLink === "function") {
      anyDoc.textWithLink(text, x, y, { url });
      return;
    }

    // Fallback: draw text + annotate link if supported
    doc.text(text, x, y);
    if (typeof anyDoc.link === "function") {
      const w = doc.getTextWidth(text);
      anyDoc.link(x, y - bodySize, w, lineHeight, { url });
    }
  };

  let xPos = (pageWidth - totalWidth) / 2;
  contactSegments.forEach((seg, idx) => {
    if (idx > 0) {
      doc.text(separator, xPos, yPos);
      xPos += sepWidth;
    }

    if (seg.url) {
      addPdfLink(seg.text, seg.url, xPos, yPos);
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

      const startFormatted = formatDateFull(exp.startDate);
      const endFormatted = exp.current ? "Present" : formatDateFull(exp.endDate);
      const hasDateRange = Boolean(startFormatted || endFormatted);
      const dateDisplay = hasDateRange
        ? `${startFormatted || ""}${startFormatted && endFormatted ? " - " : ""}${endFormatted || ""}`
        : "";

      // Company and dates - bold
      doc.setFontSize(subheaderSize);
      doc.setFont("times", "bold");
      doc.text(exp.company, marginSide, yPos);
      if (dateDisplay) {
        doc.setFontSize(bodySize);
        doc.text(dateDisplay, pageWidth - marginSide, yPos, { align: "right" });
      }
      yPos += lineHeight;

      // Job title and location - bold
      doc.setFontSize(bodySize);
      doc.setFont("times", "bold");
      doc.text(exp.jobTitle, marginSide, yPos);
      const locationDisplay = [exp.location, exp.workType].filter(Boolean).join(" | ");
      if (locationDisplay) {
        doc.text(locationDisplay, pageWidth - marginSide, yPos, { align: "right" });
      }
      yPos += lineHeight;

      // Bullets - normal
      doc.setFont("times", "normal");
      (exp.bullets || []).filter(Boolean).forEach((bullet) => {
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
      (section.items || []).forEach((item) => {
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
          (item.bullets || []).filter(Boolean).forEach((bullet) => {
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

  // Right tab stop aligned to the usable content width (8.0")
  const rightTabPos = convertInchesToTwip(8.0);

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

    const noSpaces = trimmed.replace(/\s+/g, "");
    const normalized = noSpaces.startsWith("http") ? noSpaces : `https://${noSpaces}`;

    try {
      // eslint-disable-next-line no-new
      new URL(normalized);
      return normalized;
    } catch {
      return null;
    }
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
      const startFormatted = formatDateFull(exp.startDate);
      const endFormatted = exp.current ? "Present" : formatDateFull(exp.endDate);
      const hasDateRange = Boolean(startFormatted || endFormatted);
      const dateDisplay = hasDateRange
        ? `${startFormatted || ""}${startFormatted && endFormatted ? " - " : ""}${endFormatted || ""}`
        : "";

      const locationDisplay = [exp.location, exp.workType].filter(Boolean).join(" | ");
      const bullets = (exp.bullets || []).filter(Boolean);

      // Company and dates
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: exp.company, bold: true, size: subheaderSize, font: "Times New Roman" }),
            ...(dateDisplay
              ? [new TextRun({ text: `\t${dateDisplay}`, bold: true, size: bodySize, font: "Times New Roman" })]
              : []),
          ],
          tabStops: [{ type: TabStopType.RIGHT, position: rightTabPos }],
          spacing: { before: 0, after: 0 },
        })
      );

      // Title and location
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: exp.jobTitle, bold: true, size: bodySize, font: "Times New Roman" }),
            ...(locationDisplay
              ? [new TextRun({ text: `\t${locationDisplay}`, bold: true, size: bodySize, font: "Times New Roman" })]
              : []),
          ],
          tabStops: [{ type: TabStopType.RIGHT, position: rightTabPos }],
          spacing: { before: 0, after: bullets.length > 0 ? 0 : sectionSpacing },
        })
      );

      // Bullets
      bullets.forEach((bullet, idx) => {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: `• ${bullet}`, size: bodySize, font: "Times New Roman" })],
            indent: { left: 180 },
            spacing: { after: idx === bullets.length - 1 ? sectionSpacing : 0 },
          })
        );
      });
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
          tabStops: [{ type: TabStopType.RIGHT, position: rightTabPos }],
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
      (section.items || []).forEach((item) => {
        if (item.title) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: item.title, bold: true, size: subheaderSize, font: "Times New Roman" }),
                new TextRun({ text: item.date ? `\t${item.date}` : "", size: bodySize, font: "Times New Roman" }),
              ],
              tabStops: [{ type: TabStopType.RIGHT, position: rightTabPos }],
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

          (item.bullets || []).filter(Boolean).forEach((bullet) => {
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
