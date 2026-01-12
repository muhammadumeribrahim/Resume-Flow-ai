import { useState } from "react";
import { Header } from "@/components/Header";
import { InputModeSelector } from "@/components/InputModeSelector";
import { TailorResumeFlow } from "@/components/TailorResumeFlow";
import { ResumeForm } from "@/components/ResumeForm";
import { ResumePreview } from "@/components/ResumePreview";
import { ATSScoreCard } from "@/components/ATSScoreCard";
import { JobDescriptionInput } from "@/components/JobDescriptionInput";
import { ExportButtons } from "@/components/ExportButtons";
import { ATSScore, ResumeAnalysis, ResumeData, ResumeFormat } from "@/types/resume";
import { createEmptyResume, generatePlainTextResume } from "@/lib/resumeUtils";
import { analyzeImportedResume, applyOptimizations, optimizeResume, compressResumeToOnePage } from "@/lib/aiOptimization";
import { normalizeATSScore } from "@/lib/atsScoreUtils";
import { generateDOCX, generatePDF } from "@/lib/documentExport";
import { extractResumeTextFromFile } from "@/lib/resumeImport";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff, Save, Minimize2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Index = () => {
  const { user } = useAuth();
  const [mode, setMode] = useState<"select" | "form" | "tailor">("select");
  const [resumeData, setResumeData] = useState<ResumeData>(createEmptyResume());
  const [jobDescription, setJobDescription] = useState("");
  const [extractedKeywords, setExtractedKeywords] = useState<string[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [resumeFormat, setResumeFormat] = useState<ResumeFormat>("standard");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [resumeName, setResumeName] = useState("");
  const [atsScore, setAtsScore] = useState<ATSScore>({
    overall: 0,
    keywordMatch: 0,
    formatting: 0,
    structure: 0,
    suggestions: [
      "Add a professional summary to highlight key qualifications",
      "Include 3-5 bullet points per experience with quantified achievements",
      "Add relevant skills that match common job requirements",
    ],
  });

  const handleSelectMode = (selectedMode: "form" | "paste" | "tailor") => {
    if (selectedMode === "form") {
      setMode("form");
    } else if (selectedMode === "tailor") {
      setMode("tailor");
    }
  };

  const handleImportResume = async (file: File) => {
    setIsAnalyzing(true);

    try {
      const rawText = await extractResumeTextFromFile(file);
      if (!rawText || rawText.trim().length < 50) {
        throw new Error("We couldn't extract enough text from that file. Try a different PDF/DOCX, or upload a TXT version.");
      }

      await processResumeText(rawText);
      toast.success("Resume imported and analyzed. Review the findings, then continue to optimize.");
    } catch (error) {
      console.error("Import error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to import resume. Please try a different file.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImportText = async (text: string) => {
    setIsAnalyzing(true);

    try {
      await processResumeText(text);
      toast.success("Resume text parsed and analyzed. Review the findings, then continue to optimize.");
    } catch (error) {
      console.error("Import error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to parse resume text.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const processResumeText = async (rawText: string) => {
    const result = await analyzeImportedResume(rawText);

    setResumeData(result.parsedResumeData);
    setAnalysis(result.analysis);

    if (result.atsScore) {
      setAtsScore(
        normalizeATSScore(result.atsScore, result.parsedResumeData, {
          hasTargetJob: false,
        })
      );
    } else {
      // fall back to a minimal score card from analysis.score
      setAtsScore((prev) =>
        normalizeATSScore(
          {
            ...prev,
            overall: result.analysis.score,
            suggestions: result.analysis.weaknesses?.slice(0, 3) || prev.suggestions,
          },
          result.parsedResumeData,
          { hasTargetJob: false }
        )
      );
    }

    if (result.extractedKeywords) {
      setExtractedKeywords(result.extractedKeywords);
    }
  };

  const handleTailorComplete = (data: ResumeData, score: ATSScore, keywords: string[]) => {
    setResumeData(data);
    setAtsScore(
      normalizeATSScore(score, data, {
        hasTargetJob: true,
      })
    );
    setExtractedKeywords(keywords);
    setMode("form");
  };

  const handleOptimize = async () => {
    if (!resumeData.personalInfo.fullName) {
      toast.error("Please add your name before optimizing");
      return;
    }

    const hasTargetJob = jobDescription.trim().length >= 50;

    setIsOptimizing(true);

    try {
      const result = await optimizeResume(
        resumeData,
        hasTargetJob ? jobDescription : undefined,
        atsScore.suggestions
      );

      const optimizedData = applyOptimizations(resumeData, result);
      setResumeData(optimizedData);

      setAtsScore(
        normalizeATSScore(result.atsScore, optimizedData, {
          hasTargetJob,
        })
      );

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

  const handleCompressToOnePage = async () => {
    if (!resumeData.personalInfo.fullName) {
      toast.error("Please add content before compressing");
      return;
    }

    setIsCompressing(true);
    try {
      const compressed = await compressResumeToOnePage(resumeData);
      setResumeData(compressed);
      toast.success("Resume compressed to fit one page!");
    } catch (error) {
      console.error("Compression error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to compress resume");
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSaveResume = async () => {
    if (!resumeData.personalInfo.fullName) {
      toast.error("Please add your name before saving");
      return;
    }
    if (!resumeName.trim()) {
      toast.error("Please enter a name for this resume");
      return;
    }

    setIsSaving(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from("saved_resumes").insert([{
        user_id: user?.id as string,
        name: resumeName.trim(),
        resume_data: resumeData as any,
        ats_score: atsScore.overall,
        target_job: jobDescription ? jobDescription.slice(0, 200) : null,
      }]);

      if (error) throw error;

      toast.success("Resume saved successfully!");
      setSaveDialogOpen(false);
      setResumeName("");
    } catch (error) {
      console.error("Error saving resume:", error);
      toast.error("Failed to save resume");
    } finally {
      setIsSaving(false);
    }
  };

  if (mode === "select") {
    return (
      <div className="min-h-screen gradient-surface">
        <Header />
        <InputModeSelector
          onSelectMode={handleSelectMode}
          onImportResume={handleImportResume}
          onImportText={handleImportText}
          isAnalyzing={isAnalyzing}
          analysis={analysis}
        />
      </div>
    );
  }

  if (mode === "tailor") {
    return (
      <div className="min-h-screen gradient-surface">
        <Header />
        <TailorResumeFlow
          onComplete={handleTailorComplete}
          onBack={() => setMode("select")}
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
            <Button
              variant="outline"
              size="sm"
              onClick={handleCompressToOnePage}
              disabled={!resumeData.personalInfo.fullName || isCompressing}
              title="Compress to one page"
            >
              <Minimize2 className="w-4 h-4 mr-1.5" />
              {isCompressing ? "Compressing..." : "1 Page"}
            </Button>
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" size="sm" disabled={!resumeData.personalInfo.fullName}>
                  <Save className="w-4 h-4 mr-1.5" />
                  Save
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Resume</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Resume Name</Label>
                    <Input
                      placeholder="e.g., Software Engineer Resume"
                      value={resumeName}
                      onChange={(e) => setResumeName(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleSaveResume} disabled={isSaving} className="w-full">
                    {isSaving ? "Saving..." : "Save Resume"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
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

            {/* Bottom Export Buttons for easy access */}
            <Card className="p-4 glass-effect">
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Ready to download your resume?
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    onClick={handleExportPDF}
                    disabled={!resumeData.personalInfo.fullName}
                    className="gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Download PDF
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleExportDOCX}
                    disabled={!resumeData.personalInfo.fullName}
                    className="gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Download DOCX
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          <div className={`space-y-6 ${!showPreview ? "hidden lg:block" : ""}`}>
            <ATSScoreCard score={atsScore} keywordMatchEnabled={jobDescription.trim().length >= 50} />

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
