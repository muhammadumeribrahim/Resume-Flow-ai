import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Edit, Upload, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { ResumeAnalysis } from "@/types/resume";

interface InputModeSelectorProps {
  onSelectMode: (mode: "form" | "paste") => void;
  onImportResume: (file: File) => void;
  isAnalyzing?: boolean;
  analysis?: ResumeAnalysis | null;
}

export const InputModeSelector = ({ 
  onSelectMode, 
  onImportResume, 
  isAnalyzing = false,
  analysis = null 
}: InputModeSelectorProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportResume(file);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-3">
            Create Your ATS-Optimized Resume
          </h1>
          <p className="text-muted-foreground text-lg">
            Choose how you'd like to get started
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {/* Start Fresh Card */}
          <Card
            className="p-6 cursor-pointer border-2 border-border hover:border-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 group glass-effect"
            onClick={() => onSelectMode("form")}
          >
            <div className="flex flex-col items-center text-center h-full">
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                <Edit className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-xl mb-2 text-foreground">Start Fresh</h3>
              <p className="text-sm text-muted-foreground mb-6 flex-1">
                Build your resume from scratch using our structured form with real-time preview
              </p>
              <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>

          {/* Import Resume Card */}
          <Card className="p-6 border-2 border-border hover:border-accent transition-all duration-300 hover:shadow-lg hover:shadow-accent/10 glass-effect">
            <div className="flex flex-col items-center text-center h-full">
              <div className="w-16 h-16 rounded-xl bg-accent/10 flex items-center justify-center mb-5 hover:scale-110 transition-all duration-300">
                <Upload className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-heading font-semibold text-xl mb-2 text-foreground">Import Your Resume</h3>
              <p className="text-sm text-muted-foreground mb-6 flex-1">
                Upload your current resume (PDF, DOCX, or TXT) and we'll analyze it for improvements
              </p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              
              <Button
                variant="accent"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>

        {/* Analysis Results */}
        {analysis && (
          <Card className="mt-8 p-6 border-2 border-warning/50 glass-effect">
            <h3 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-warning" />
              Resume Analysis Results
            </h3>
            
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Current Score</h4>
                <div className="text-3xl font-bold text-warning">{analysis.score}%</div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Areas for Improvement</h4>
                <ul className="space-y-1">
                  {analysis.weaknesses.slice(0, 3).map((weakness, idx) => (
                    <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                      <span className="text-destructive mt-0.5">•</span>
                      {weakness}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button 
                variant="default" 
                onClick={() => onSelectMode("form")}
                className="flex-1"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Continue & Optimize with AI
              </Button>
            </div>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground mt-8">
          Your data is processed securely and never stored without your permission.
        </p>
      </div>
    </div>
  );
};
