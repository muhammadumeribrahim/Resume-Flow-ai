import { ResumeData, ExperienceItem, EducationItem, SkillCategory, CustomSection, CustomSectionItem } from "@/types/resume";

export const createEmptyResume = (): ResumeData => ({
  personalInfo: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    portfolio: "",
  },
  summary: "",
  coreStrengths: [],
  experience: [],
  education: [],
  customSections: [],
  skills: [],
});

export const createEmptyExperience = (): ExperienceItem => ({
  id: crypto.randomUUID(),
  jobTitle: "",
  company: "",
  location: "",
  workType: "",
  startDate: "",
  endDate: "",
  current: false,
  bullets: [""],
});

export const createEmptyEducation = (): EducationItem => ({
  id: crypto.randomUUID(),
  degree: "",
  field: "",
  institution: "",
  location: "",
  graduationDate: "",
  gpa: "",
});

export const createEmptySkillCategory = (): SkillCategory => ({
  id: crypto.randomUUID(),
  category: "",
  skills: "",
});

export const createEmptyCustomSection = (): CustomSection => ({
  id: crypto.randomUUID(),
  title: "",
  items: [],
});

export const createEmptyCustomSectionItem = (): CustomSectionItem => ({
  id: crypto.randomUUID(),
  title: "",
  subtitle: "",
  date: "",
  description: "",
  bullets: [""],
});

export const formatDate = (dateString: string): string => {
  if (!dateString) return "";
  const date = new Date(dateString + "-01");
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
};

export const formatDateFull = (dateString: string | undefined | null): string => {
  if (!dateString || dateString.trim() === "") return "";
  const parts = dateString.split("-");
  if (parts.length < 2) return dateString; // Return as-is if not proper format
  const [year, month] = parts;
  const monthIndex = parseInt(month) - 1;
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  if (isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) return year || "";
  return `${monthNames[monthIndex]} ${year}`;
};

export const generatePlainTextResume = (data: ResumeData): string => {
  let text = "";
  
  // Header
  text += `${data.personalInfo.fullName.toUpperCase()}\n`;
  const contactParts = [
    data.personalInfo.location,
    data.personalInfo.phone,
    data.personalInfo.email,
    data.personalInfo.github ? `GitHub: ${data.personalInfo.github}` : null,
    data.personalInfo.portfolio ? `Portfolio: ${data.personalInfo.portfolio}` : null,
    data.personalInfo.linkedin,
  ].filter(Boolean);
  text += `${contactParts.join(" | ")}\n\n`;
  
  // Summary
  if (data.summary) {
    text += `SUMMARY\n`;
    text += `${data.summary}\n\n`;
  }
  
  // Core Strengths
  if (data.coreStrengths && data.coreStrengths.length > 0) {
    text += `CORE STRENGTHS\n`;
    data.coreStrengths.forEach((cat) => {
      if (cat.category && cat.skills) {
        text += `• ${cat.category}: ${cat.skills}\n`;
      }
    });
    text += "\n";
  }
  
  // Experience
  if (data.experience.length > 0) {
    text += `EXPERIENCE\n`;
    data.experience.forEach((exp) => {
      text += `\n${exp.company}\t\t${formatDateFull(exp.startDate)} - ${exp.current ? "Present" : formatDateFull(exp.endDate)}\n`;
      text += `${exp.jobTitle}\t\t${exp.location}${exp.workType ? ` | ${exp.workType}` : ""}\n`;
      exp.bullets.filter(Boolean).forEach((bullet) => {
        text += `• ${bullet}\n`;
      });
    });
    text += "\n";
  }
  
  // Education
  if (data.education.length > 0) {
    text += `EDUCATION\n`;
    data.education.forEach((edu) => {
      text += `${edu.institution}\t\t${edu.graduationDate ? formatDateFull(edu.graduationDate) : ""}\n`;
      text += `${edu.degree}${edu.field ? ` in ${edu.field}` : ""}`;
      if (edu.gpa) text += ` | GPA: ${edu.gpa}`;
      text += "\n";
    });
  }

  // Custom Sections
  if (data.customSections && data.customSections.length > 0) {
    data.customSections.forEach((section) => {
      if (section.title) {
        text += `\n${section.title.toUpperCase()}\n`;
        section.items.forEach((item) => {
          if (item.title) {
            text += `${item.title}${item.date ? `\t\t${item.date}` : ""}\n`;
            if (item.subtitle) text += `${item.subtitle}\n`;
            if (item.description) text += `${item.description}\n`;
            item.bullets.filter(Boolean).forEach((bullet) => {
              text += `• ${bullet}\n`;
            });
          }
        });
      }
    });
  }
  
  return text;
};
