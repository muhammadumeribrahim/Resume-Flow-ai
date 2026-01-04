import { supabase } from "@/integrations/supabase/client";
import type { ATSScore, ResumeAnalysis, ResumeData } from "@/types/resume";

interface OptimizationResult {
  optimizedSummary: string;
  optimizedCoreStrengths?: { id: string; category: string; skills: string }[];
  optimizedSkills?: string[];
  optimizedExperience: {
    id: string;
    optimizedBullets: string[];
  }[];
  atsScore: ATSScore;
  extractedKeywords: string[];
}

interface ImportAnalysisResult {
  parsedResumeData: ResumeData;
  analysis: ResumeAnalysis;
  atsScore?: ATSScore;
  extractedKeywords?: string[];
}

export const optimizeResume = async (
  resumeData: ResumeData,
  jobDescription?: string
): Promise<OptimizationResult> => {
  const { data, error } = await supabase.functions.invoke<OptimizationResult>("optimize-resume", {
    body: { resumeData, jobDescription },
  });

  if (error) {
    throw new Error(error.message || "Failed to optimize resume");
  }

  if (!data) {
    throw new Error("No data returned from optimization");
  }

  return data;
};

export const analyzeImportedResume = async (rawResumeText: string): Promise<ImportAnalysisResult> => {
  const { data, error } = await supabase.functions.invoke<ImportAnalysisResult>("optimize-resume", {
    body: { action: "import", rawResumeText },
  });

  if (error) {
    throw new Error(error.message || "Failed to analyze imported resume");
  }

  if (!data) {
    throw new Error("No data returned from import analysis");
  }

  return data;
};

export const tailorResumeToJob = async (
  rawResumeText: string,
  jobDescription: string
): Promise<ImportAnalysisResult> => {
  const { data, error } = await supabase.functions.invoke<ImportAnalysisResult>("optimize-resume", {
    body: { action: "tailor", rawResumeText, jobDescription },
  });

  if (error) {
    throw new Error(error.message || "Failed to tailor resume");
  }

  if (!data) {
    throw new Error("No data returned from tailoring");
  }

  return data;
};

export const applyOptimizations = (
  currentData: ResumeData,
  optimizations: OptimizationResult
): ResumeData => {
  // Update experience bullets
  const updatedExperience = currentData.experience.map((exp) => {
    const optimizedExp = optimizations.optimizedExperience.find((o) => o.id === exp.id);
    if (optimizedExp && optimizedExp.optimizedBullets) {
      return { ...exp, bullets: optimizedExp.optimizedBullets };
    }
    return exp;
  });

  // Update core strengths if provided
  let updatedCoreStrengths = currentData.coreStrengths || [];
  if (optimizations.optimizedCoreStrengths && optimizations.optimizedCoreStrengths.length > 0) {
    updatedCoreStrengths = optimizations.optimizedCoreStrengths.map((cs) => ({
      id: cs.id || crypto.randomUUID(),
      category: cs.category,
      skills: cs.skills,
    }));
  }

  // Update skills array for backward compatibility
  let updatedSkills = currentData.skills;
  if (optimizations.optimizedSkills) {
    updatedSkills = optimizations.optimizedSkills;
  }

  return {
    ...currentData,
    summary: optimizations.optimizedSummary || currentData.summary,
    coreStrengths: updatedCoreStrengths,
    skills: updatedSkills,
    experience: updatedExperience,
  };
};
