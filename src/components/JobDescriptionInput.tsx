import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Target, FileText, X, ChevronDown, ChevronUp } from "lucide-react";

interface JobDescriptionInputProps {
  jobDescription: string;
  onJobDescriptionChange: (value: string) => void;
  extractedKeywords: string[];
}

export const JobDescriptionInput = ({
  jobDescription,
  onJobDescriptionChange,
  extractedKeywords,
}: JobDescriptionInputProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="p-5 bg-card border-border shadow-md overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10">
            <Target className="w-5 h-5 text-accent" />
          </div>
          <div className="text-left">
            <h3 className="font-heading font-semibold text-foreground">Target Job Description</h3>
            <p className="text-xs text-muted-foreground">
              {jobDescription ? "Job description added" : "Optional: Paste to optimize keywords"}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4 animate-fade-in">
          <div className="grid gap-2">
            <Label htmlFor="jobDescription">Job Description</Label>
            <Textarea
              id="jobDescription"
              placeholder="Paste the full job description here. The AI will analyze it to optimize your resume keywords and phrasing..."
              value={jobDescription}
              onChange={(e) => onJobDescriptionChange(e.target.value)}
              rows={6}
              className="resize-none"
            />
          </div>

          {extractedKeywords.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Extracted Keywords
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {extractedKeywords.map((keyword, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-xs bg-accent/10 text-accent hover:bg-accent/20"
                  >
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
