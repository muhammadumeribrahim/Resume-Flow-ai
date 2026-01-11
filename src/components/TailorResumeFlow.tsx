import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Sparkles, ArrowLeft, FileText, AlertCircle, ClipboardPaste } from "lucide-react";
import { ResumeData, ATSScore, ResumeAnalysis } from "@/types/resume";
import { extractResumeTextFromFile } from "@/lib/resumeImport";
import { tailorResumeToJob } from "@/lib/aiOptimization";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TailorResumeFlowProps {
  onComplete: (data: ResumeData, atsScore: ATSScore, keywords: string[]) => void;
  onBack: () => void;
}

export const TailorResumeFlow = ({ onComplete, onBack }: TailorResumeFlowProps) => {
  const [step, setStep] = useState<"job" | "resume" | "processing">("job");
  const [jobDescription, setJobDescription] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasteDialog, setShowPasteDialog] = useState(false);
  const [pastedResumeText, setPastedResumeText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleJobDescriptionNext = () => {
    if (jobDescription.trim().length < 50) {
      toast.error("Please paste a complete job description (at least 50 characters)");
      return;
    }
    setStep("resume");
  };

  const processResumeText = async (rawText: string, sourceName: string) => {
    setUploadedFileName(sourceName);
    setError(null);
    setIsProcessing(true);
    setStep("processing");

    try {
      if (!rawText || rawText.trim().length < 50) {
        throw new Error("Not enough text content. Please provide more resume content.");
      }

      const result = await tailorResumeToJob(rawText, jobDescription);

      toast.success("Resume tailored successfully for your target job!");
      onComplete(
        result.parsedResumeData,
        result.atsScore || {
          overall: result.analysis.score,
          keywordMatch: 0,
          formatting: 100,
          structure: 0,
          suggestions: result.analysis.weaknesses?.slice(0, 3) || [],
        },
        result.extractedKeywords || []
      );
    } catch (err) {
      console.error("Tailoring error:", err);
      setError(err instanceof Error ? err.message : "Failed to process resume");
      setStep("resume");
      toast.error(err instanceof Error ? err.message : "Failed to tailor resume");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const rawText = await extractResumeTextFromFile(file);
      await processResumeText(rawText, file.name);
    } catch (err) {
      console.error("File extraction error:", err);
      setError(err instanceof Error ? err.message : "Failed to read file");
      toast.error("Failed to read file. Please try a different format.");
    }
  };

  const handlePasteSubmit = async () => {
    if (pastedResumeText.trim().length < 50) {
      toast.error("Please paste more resume content (at least 50 characters)");
      return;
    }
    setShowPasteDialog(false);
    await processResumeText(pastedResumeText, "Pasted Resume");
    setPastedResumeText("");
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mb-6 gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-2">
            Tailor Resume for a Specific Job
          </h1>
          <p className="text-muted-foreground">
            {step === "job" && "Paste the target job description to begin"}
            {step === "resume" && "Upload or paste your current resume to tailor it"}
            {step === "processing" && "AI is tailoring your resume..."}
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex justify-center gap-3 mb-8">
          <div className={`w-3 h-3 rounded-full transition-colors ${step === "job" ? "bg-primary" : "bg-primary/30"}`} />
          <div className={`w-3 h-3 rounded-full transition-colors ${step === "resume" ? "bg-primary" : step === "processing" ? "bg-primary/30" : "bg-muted"}`} />
          <div className={`w-3 h-3 rounded-full transition-colors ${step === "processing" ? "bg-primary" : "bg-muted"}`} />
        </div>

        {/* Step 1: Job Description */}
        {step === "job" && (
          <Card className="p-6 glass-effect">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Target Job Description
                </label>
                <Textarea
                  placeholder="Paste the full job description here... Include requirements, responsibilities, and qualifications for best results."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="min-h-[250px] resize-none"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {jobDescription.length} characters • Minimum 50 required
                </p>
              </div>

              <Button
                onClick={handleJobDescriptionNext}
                disabled={jobDescription.trim().length < 50}
                className="w-full"
              >
                Continue to Upload Resume
                <Sparkles className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 2: Resume Upload */}
        {step === "resume" && (
          <Card className="p-6 glass-effect">
            <div className="space-y-6">
              {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="text-center py-8 border-2 border-dashed border-border rounded-xl hover:border-primary/50 transition-colors">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-foreground font-medium mb-1">
                  Upload or Paste Your Current Resume
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  PDF, DOCX, TXT, or paste text directly
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    variant="default"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowPasteDialog(true)}
                  >
                    <ClipboardPaste className="w-4 h-4 mr-2" />
                    Paste Text
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Job targeting:</strong> Your resume will be optimized with keywords and phrasing from the job description you provided, maximizing ATS match and relevance.
                </p>
              </div>

              <Button
                variant="ghost"
                onClick={() => setStep("job")}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Edit Job Description
              </Button>
            </div>
          </Card>
        )}

        {/* Step 3: Processing */}
        {step === "processing" && (
          <Card className="p-8 glass-effect">
            <div className="text-center space-y-6">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-primary" />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Tailoring Your Resume...
                </h3>
                <p className="text-sm text-muted-foreground">
                  AI is analyzing the job requirements and optimizing your resume for maximum ATS compatibility
                </p>
              </div>

              {uploadedFileName && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  {uploadedFileName}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Paste Text Dialog */}
        <Dialog open={showPasteDialog} onOpenChange={setShowPasteDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardPaste className="w-5 h-5" />
                Paste Your Resume Text
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Copy and paste your entire resume content below. We'll parse and tailor it for your target job.
              </p>
              <Textarea
                placeholder="Paste your resume content here...

Example:
John Doe
Software Engineer
john.doe@email.com | (555) 123-4567

EXPERIENCE
Company Name | Jan 2022 - Present
• Developed web applications using React and TypeScript
• Led team of 5 developers on major product launches
..."
                value={pastedResumeText}
                onChange={(e) => setPastedResumeText(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {pastedResumeText.length} characters {pastedResumeText.length < 50 && pastedResumeText.length > 0 && "(minimum 50)"}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPasteDialog(false);
                      setPastedResumeText("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handlePasteSubmit}
                    disabled={pastedResumeText.trim().length < 50}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Tailor Resume
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
