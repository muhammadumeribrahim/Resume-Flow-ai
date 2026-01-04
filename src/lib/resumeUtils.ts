import { ResumeData, ExperienceItem, EducationItem } from "@/types/resume";

export const createEmptyResume = (): ResumeData => ({
  personalInfo: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
  },
  summary: "",
  experience: [],
  education: [],
  skills: [],
});

export const createEmptyExperience = (): ExperienceItem => ({
  id: crypto.randomUUID(),
  jobTitle: "",
  company: "",
  location: "",
  startDate: "",
  endDate: "",
  current: false,
  bullets: [""],
});

export const createEmptyEducation = (): EducationItem => ({
  id: crypto.randomUUID(),
  degree: "",
  institution: "",
  location: "",
  graduationDate: "",
  gpa: "",
});

export const formatDate = (dateString: string): string => {
  if (!dateString) return "";
  const date = new Date(dateString + "-01");
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
};

export const generatePlainTextResume = (data: ResumeData): string => {
  let text = "";
  
  // Header
  text += `${data.personalInfo.fullName.toUpperCase()}\n`;
  const contactParts = [
    data.personalInfo.email,
    data.personalInfo.phone,
    data.personalInfo.location,
    data.personalInfo.linkedin,
  ].filter(Boolean);
  text += `${contactParts.join(" | ")}\n\n`;
  
  // Summary
  if (data.summary) {
    text += `PROFESSIONAL SUMMARY\n`;
    text += `${data.summary}\n\n`;
  }
  
  // Skills
  if (data.skills.length > 0) {
    text += `SKILLS\n`;
    text += `${data.skills.join(" • ")}\n\n`;
  }
  
  // Experience
  if (data.experience.length > 0) {
    text += `PROFESSIONAL EXPERIENCE\n`;
    data.experience.forEach((exp) => {
      text += `\n${exp.jobTitle}\n`;
      text += `${exp.company} | ${exp.location} | ${formatDate(exp.startDate)} - ${exp.current ? "Present" : formatDate(exp.endDate)}\n`;
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
      text += `${edu.degree}\n`;
      text += `${edu.institution} | ${edu.location} | ${formatDate(edu.graduationDate)}`;
      if (edu.gpa) text += ` | GPA: ${edu.gpa}`;
      text += "\n";
    });
  }
  
  return text;
};
