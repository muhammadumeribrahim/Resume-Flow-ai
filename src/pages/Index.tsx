import { useState, useCallback } from "react";
import { Header } from "@/components/Header";
import { InputModeSelector } from "@/components/InputModeSelector";
import { ResumeForm } from "@/components/ResumeForm";
import { ResumePreview } from "@/components/ResumePreview";
import { ATSScoreCard } from "@/components/ATSScoreCard";
import { JobDescriptionInput } from "@/components/JobDescriptionInput";
import { ExportButtons } from "@/components/ExportButtons";
import { ResumeData, ATSScore } from "@/types/resume";
import { createEmptyResume, generatePlainTextResume } from "@/lib/resumeUtils";
import { optimizeResume, applyOptimizations } from "@/lib/aiOptimization";
import { generatePDF, generateDOCX } from "@/lib/documentExport";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [mode, setMode] = useState<"select" | "form">("select");
  const [resumeData, setResumeData] = useState<ResumeData>(createEmptyResume());
  const [jobDescription, setJobDescription] = useState("");
  const [extractedKeywords, setExtractedKeywords] = useState<string[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [atsScore, setAtsScore] = useState<ATSScore>({
    overall: 0,
    keywordMatch: 0,
    formatting: 100,
    structure: 0,
    suggestions: [
      "Add a professional summary to highlight key qualifications",
      "Include 3-5 bullet points per experience with quantified achievements",
      "Add relevant skills that match common job requirements",
    ],
  });

  const handleSelectMode = (selectedMode: "form" | "paste") => {
    if (selectedMode === "form") {
      setMode("form");
    }
  };

  const handlePasteResume = (text: string) => {
    // Simple parsing logic - in production this would be AI-powered
    const lines = text.split("\n").filter((l) => l.trim());
    const parsed = createEmptyResume();

    // Try to extract name from first line
    if (lines[0]) {
      parsed.personalInfo.fullName = lines[0].trim();
    }

    // Try to find email
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch) {
      parsed.personalInfo.email = emailMatch[0];
    }

    // Try to find phone
    const phoneMatch = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    if (phoneMatch) {
      parsed.personalInfo.phone = phoneMatch[0];
    }

    setResumeData(parsed);
    setMode("form");
    toast.success("Resume parsed! Review and complete the details.");
  };

  const handleOptimize = async () => {
    if (!resumeData.personalInfo.fullName) {
      toast.error("Please add your name before optimizing");
      return;
    }

    setIsOptimizing(true);
    
    try {
      const result = await optimizeResume(resumeData, jobDescription || undefined);
      
      // Apply optimizations to the resume data
      const optimizedData = applyOptimizations(resumeData, result);
      setResumeData(optimizedData);
      
      // Update ATS score
      setAtsScore(result.atsScore);
      
      // Update extracted keywords
      if (result.extractedKeywords) {
        setExtractedKeywords(result.extractedKeywords);
      }
      
      toast.success("Resume optimized for ATS! Check your updated score.");
    } catch (error) {
      console.error("Optimization error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to optimize resume");
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleExportPDF = () => {
    if (!resumeData.personalInfo.fullName) {
      toast.error("Please add your name before exporting");
      return;
    }
    
    try {
      generatePDF(resumeData);
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to generate PDF");
    }
  };

  const handleExportDOCX = async () => {
    if (!resumeData.personalInfo.fullName) {
      toast.error("Please add your name before exporting");
      return;
    }
    
    try {
      await generateDOCX(resumeData);
      toast.success("DOCX downloaded successfully!");
    } catch (error) {
      console.error("DOCX export error:", error);
      toast.error("Failed to generate DOCX");
    }
  };

  const handleCopyText = () => {
    const text = generatePlainTextResume(resumeData);
    navigator.clipboard.writeText(text);
  };

  const handleJobDescriptionChange = (value: string) => {
    setJobDescription(value);
    // Extract keywords (simple version - AI will do better extraction during optimization)
    if (value.length > 50) {
      const commonKeywords = value
        .toLowerCase()
        .match(/\b(python|javascript|react|sql|aws|agile|communication|leadership|project management|data analysis|machine learning|excel|tableau|salesforce|marketing|sales|operations|customer service|teamwork|problem.solving)\b/gi);
      if (commonKeywords) {
        setExtractedKeywords([...new Set(commonKeywords.map((k) => k.toLowerCase()))]);
      }
    } else {
      setExtractedKeywords([]);
    }
  };

  if (mode === "select") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <InputModeSelector onSelectMode={handleSelectMode} onPasteResume={handlePasteResume} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode("select")}
            className="gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="lg:hidden gap-1.5"
            >
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPreview ? "Hide Preview" : "Show Preview"}
            </Button>
            <ExportButtons
              onExportPDF={handleExportPDF}
              onExportDOCX={handleExportDOCX}
              onCopyText={handleCopyText}
              disabled={!resumeData.personalInfo.fullName}
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Form */}
          <div className="space-y-6">
            <JobDescriptionInput
              jobDescription={jobDescription}
              onJobDescriptionChange={handleJobDescriptionChange}
              extractedKeywords={extractedKeywords}
            />

            <ResumeForm
              data={resumeData}
              onChange={setResumeData}
              onOptimize={handleOptimize}
              isOptimizing={isOptimizing}
            />
          </div>

          {/* Right Column - Preview & Score */}
          <div
            className={`space-y-6 ${!showPreview ? "hidden lg:block" : ""}`}
          >
            <ATSScoreCard score={atsScore} />

            <div className="bg-muted/50 rounded-xl p-4 overflow-auto max-h-[800px]">
              <div className="text-xs text-muted-foreground mb-3 flex items-center justify-between">
                <span>Live Preview</span>
                <span>ATS-Friendly Format</span>
              </div>
              <div className="transform scale-[0.85] origin-top">
                <ResumePreview data={resumeData} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
