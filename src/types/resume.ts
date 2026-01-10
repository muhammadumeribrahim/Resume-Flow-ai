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
  customSections: CustomSection[];
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

export interface CustomSection {
  id: string;
  title: string;
  items: CustomSectionItem[];
}

export interface CustomSectionItem {
  id: string;
  title: string;
  subtitle?: string;
  date?: string;
  description?: string;
  link?: string; // Optional project/item link URL
  bullets: string[];
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

export interface ResumeAnalysis {
  weaknesses: string[];
  improvements: string[];
  missingKeywords: string[];
  score: number;
}

export type ResumeFormat = 'standard' | 'compact';
