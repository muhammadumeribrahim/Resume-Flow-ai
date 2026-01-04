import { supabase } from "@/integrations/supabase/client";
import { ResumeData, ATSScore } from "@/types/resume";

interface OptimizationResult {
  optimizedSummary: string;
  optimizedSkills: string[];
  optimizedExperience: {
    id: string;
    optimizedBullets: string[];
  }[];
  atsScore: ATSScore;
  extractedKeywords: string[];
}

export const optimizeResume = async (
  resumeData: ResumeData,
  jobDescription?: string
): Promise<OptimizationResult> => {
  const { data, error } = await supabase.functions.invoke<OptimizationResult>('optimize-resume', {
    body: { resumeData, jobDescription },
  });

  if (error) {
    throw new Error(error.message || 'Failed to optimize resume');
  }

  if (!data) {
    throw new Error('No data returned from optimization');
  }

  return data;
};

export const applyOptimizations = (
  currentData: ResumeData,
  optimizations: OptimizationResult
): ResumeData => {
  const updatedExperience = currentData.experience.map((exp) => {
    const optimizedExp = optimizations.optimizedExperience.find((o) => o.id === exp.id);
    if (optimizedExp) {
      return { ...exp, bullets: optimizedExp.optimizedBullets };
    }
    return exp;
  });

  return {
    ...currentData,
    summary: optimizations.optimizedSummary,
    skills: optimizations.optimizedSkills,
    experience: updatedExperience,
  };
};
