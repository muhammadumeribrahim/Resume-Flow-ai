import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Edit, ClipboardPaste, ArrowRight } from "lucide-react";

interface InputModeSelectorProps {
  onSelectMode: (mode: "form" | "paste") => void;
  onPasteResume: (text: string) => void;
}

export const InputModeSelector = ({ onSelectMode, onPasteResume }: InputModeSelectorProps) => {
  const [pastedText, setPastedText] = useState("");

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-3">
            Create Your ATS-Optimized Resume
          </h1>
          <p className="text-muted-foreground text-lg">
            Choose how you'd like to get started
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Card
            className="p-6 cursor-pointer border-2 border-transparent hover:border-primary transition-all duration-200 hover:shadow-lg group"
            onClick={() => onSelectMode("form")}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Edit className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2">Start Fresh</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Enter your experience step-by-step using our structured form
              </p>
              <Button variant="outline" className="mt-auto group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>

          <Card className="p-6 border-2 border-transparent hover:border-accent transition-all duration-200 hover:shadow-lg">
            <div className="flex flex-col items-center text-center h-full">
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <ClipboardPaste className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2">Paste Existing Resume</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Paste your current resume text and we'll parse it
              </p>
              
              <Textarea
                placeholder="Paste your resume text here..."
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                rows={4}
                className="resize-none text-sm mb-3"
              />
              
              <Button
                variant="accent"
                disabled={!pastedText.trim()}
                onClick={() => onPasteResume(pastedText)}
                className="mt-auto w-full"
              >
                Parse Resume
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Your data is processed securely and never stored without your permission.
        </p>
      </div>
    </div>
  );
};
