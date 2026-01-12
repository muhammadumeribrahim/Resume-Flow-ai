import type { ATSScore, ResumeData } from "@/types/resume";

type NormalizeOptions = {
  hasTargetJob: boolean;
};

const normalizeTitle = (title: string) => title.trim().toLowerCase();

const hasCustomSection = (data: ResumeData, titleIncludes: RegExp) => {
  return (data.customSections ?? []).some((s) => titleIncludes.test(normalizeTitle(s.title || "")));
};

const hasNonEmptySummary = (data: ResumeData) => (data.summary ?? "").trim().length >= 50;

const hasCoreStrengths = (data: ResumeData) => (data.coreStrengths ?? []).some((c) => (c.skills ?? "").trim().length > 0);

const dedupe = (items: string[]) => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const s = (raw ?? "").trim();
    if (!s) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
};

export const normalizeATSScore = (score: ATSScore, resumeData: ResumeData, opts: NormalizeOptions): ATSScore => {
  const hasProjects = hasCustomSection(resumeData, /project/);
  const hasCerts = hasCustomSection(resumeData, /(certificat|license)/);

  const suggestions = dedupe(score.suggestions ?? []).filter((s) => {
    const lc = s.toLowerCase();

    // Don’t recommend sections that already exist
    if (hasProjects && lc.includes("project") && (lc.includes("add") || lc.includes("consider"))) return false;
    if (hasCerts && lc.includes("cert") && (lc.includes("add") || lc.includes("consider"))) return false;

    // Don’t recommend adding summary if it exists
    if (hasNonEmptySummary(resumeData) && lc.includes("summary") && (lc.includes("add") || lc.includes("include"))) return false;

    // Don’t recommend adding skills if core strengths exist
    if (hasCoreStrengths(resumeData) && lc.includes("skill") && (lc.includes("add") || lc.includes("include"))) return false;

    return true;
  });

  // Keyword match is only meaningful when a target job description is provided.
  const keywordMatch = opts.hasTargetJob ? score.keywordMatch : 0;

  return {
    ...score,
    keywordMatch,
    suggestions,
  };
};
