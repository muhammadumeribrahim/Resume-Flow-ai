export interface ResumeData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  summary: string;
  coreStrengths: SkillCategory[];
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: string[]; // Keep for backward compatibility
}

export interface SkillCategory {
  id: string;
  category: string;
  skills: string;
}

export interface ExperienceItem {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  workType?: string; // Remote, Hybrid/Remote, On-site
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
}

export interface EducationItem {
  id: string;
  degree: string;
  field?: string;
  institution: string;
  location: string;
  graduationDate: string;
  gpa?: string;
}

export interface JobDescription {
  title: string;
  company: string;
  description: string;
  extractedKeywords: string[];
}

export interface ATSScore {
  overall: number;
  keywordMatch: number;
  formatting: number;
  structure: number;
  suggestions: string[];
}
