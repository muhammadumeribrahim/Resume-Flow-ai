import { useState } from "react";
import { Header } from "@/components/Header";
import { InputModeSelector } from "@/components/InputModeSelector";
import { ResumeForm } from "@/components/ResumeForm";
import { ResumePreview } from "@/components/ResumePreview";
import { ATSScoreCard } from "@/components/ATSScoreCard";
import { JobDescriptionInput } from "@/components/JobDescriptionInput";
import { ExportButtons } from "@/components/ExportButtons";
import { ATSScore, ResumeAnalysis, ResumeData, ResumeFormat } from "@/types/resume";
import { createEmptyResume, generatePlainTextResume } from "@/lib/resumeUtils";
import { analyzeImportedResume, applyOptimizations, optimizeResume } from "@/lib/aiOptimization";
import { generateDOCX, generatePDF } from "@/lib/documentExport";
import { extractResumeTextFromFile } from "@/lib/resumeImport";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Index = () => {
  const [mode, setMode] = useState<"select" | "form">("select");
  const [resumeData, setResumeData] = useState<ResumeData>(createEmptyResume());
  const [jobDescription, setJobDescription] = useState("");
  const [extractedKeywords, setExtractedKeywords] = useState<string[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [resumeFormat, setResumeFormat] = useState<ResumeFormat>("standard");
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

  const handleImportResume = async (file: File) => {
    setIsAnalyzing(true);

    try {
      const rawText = await extractResumeTextFromFile(file);
      if (!rawText || rawText.trim().length < 50) {
        throw new Error("We couldn't extract enough text from that file. Try a different PDF/DOCX, or upload a TXT version.");
      }

      const result = await analyzeImportedResume(rawText);

      setResumeData(result.parsedResumeData);
      setAnalysis(result.analysis);

      if (result.atsScore) {
        setAtsScore(result.atsScore);
      } else {
        // fall back to a minimal score card from analysis.score
        setAtsScore((prev) => ({
          ...prev,
          overall: result.analysis.score,
          suggestions: result.analysis.weaknesses?.slice(0, 3) || prev.suggestions,
        }));
      }

      if (result.extractedKeywords) {
        setExtractedKeywords(result.extractedKeywords);
      }

      toast.success("Resume imported and analyzed. Review the findings, then continue to optimize.");
    } catch (error) {
      console.error("Import error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to import resume. Please try a different file.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleOptimize = async () => {
    if (!resumeData.personalInfo.fullName) {
      toast.error("Please add your name before optimizing");
      return;
    }

    setIsOptimizing(true);

    try {
      const result = await optimizeResume(resumeData, jobDescription || undefined);

      const optimizedData = applyOptimizations(resumeData, result);
      setResumeData(optimizedData);

      setAtsScore(result.atsScore);

      if (result.extractedKeywords) {
        setExtractedKeywords(result.extractedKeywords);
      }

      setAnalysis(null);
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
      generatePDF(resumeData, resumeFormat);
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
      await generateDOCX(resumeData, resumeFormat);
      toast.success("DOCX downloaded successfully!");
    } catch (error) {
      console.error("DOCX export error:", error);
      toast.error("Failed to generate DOCX");
    }
  };

  const handleCopyText = () => {
    const text = generatePlainTextResume(resumeData);
    navigator.clipboard.writeText(text);
    toast.success("Resume copied to clipboard!");
  };

  const handleJobDescriptionChange = (value: string) => {
    setJobDescription(value);
    if (value.length > 50) {
      const commonKeywords = value
        .toLowerCase()
        .match(
          /\b(python|javascript|react|sql|aws|agile|communication|leadership|project management|data analysis|machine learning|excel|tableau|salesforce|marketing|sales|operations|customer service|teamwork|problem.solving)\b/gi
        );
      if (commonKeywords) {
        setExtractedKeywords([...new Set(commonKeywords.map((k) => k.toLowerCase()))]);
      }
    } else {
      setExtractedKeywords([]);
    }
  };

  if (mode === "select") {
    return (
      <div className="min-h-screen gradient-surface">
        <Header />
        <InputModeSelector
          onSelectMode={handleSelectMode}
          onImportResume={handleImportResume}
          isAnalyzing={isAnalyzing}
          analysis={analysis}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-surface">
      <Header />

      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setMode("select");
              setAnalysis(null);
            }}
            className="gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <div className="flex items-center gap-3">
            <Select value={resumeFormat} onValueChange={(v) => setResumeFormat(v as ResumeFormat)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="compact">Compact</SelectItem>
              </SelectContent>
            </Select>

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

          <div className={`space-y-6 ${!showPreview ? "hidden lg:block" : ""}`}>
            <ATSScoreCard score={atsScore} />

            <div className="bg-muted/30 rounded-xl p-4 overflow-auto max-h-[800px] glass-effect">
              <div className="text-xs text-muted-foreground mb-3 flex items-center justify-between">
                <span>Live Preview ({resumeFormat === "standard" ? "Standard" : "Compact"})</span>
                <span>ATS-Friendly Format • 8.5" × 11"</span>
              </div>
              <div className="flex justify-center">
                <div className="transform scale-[0.65] origin-top">
                  <ResumePreview data={resumeData} format={resumeFormat} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
