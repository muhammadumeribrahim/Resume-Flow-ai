import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle, Target } from "lucide-react";
import { ATSScore } from "@/types/resume";

interface ATSScoreCardProps {
  score: ATSScore;
  keywordMatchEnabled?: boolean;
}

export const ATSScoreCard = ({ score, keywordMatchEnabled = false }: ATSScoreCardProps) => {
  const getScoreColor = (value: number) => {
    if (value >= 90) return "text-success";
    if (value >= 70) return "text-warning";
    return "text-destructive";
  };

  const getProgressColor = (value: number) => {
    if (value >= 90) return "bg-success";
    if (value >= 70) return "bg-warning";
    return "bg-destructive";
  };

  return (
    <Card className="p-5 bg-card border-border shadow-md">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Target className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-heading font-semibold text-foreground">ATS Score</h3>
          <p className="text-xs text-muted-foreground">Resume optimization analysis</p>
        </div>
      </div>

      <div className="flex items-center justify-center mb-6">
        <div className="relative w-28 h-28">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-muted"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${score.overall * 2.51} 251`}
              className={getScoreColor(score.overall)}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-3xl font-heading font-bold ${getScoreColor(score.overall)}`}>
              {score.overall}%
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">
              Keyword Match
              {!keywordMatchEnabled && (
                <span className="ml-1 text-xs text-muted-foreground">(add a target job to score)</span>
              )}
            </span>
            <span className="font-medium">{keywordMatchEnabled ? `${score.keywordMatch}%` : "N/A"}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${keywordMatchEnabled ? getProgressColor(score.keywordMatch) : "bg-muted"}`}
              style={{ width: `${keywordMatchEnabled ? score.keywordMatch : 0}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Formatting</span>
            <span className="font-medium">{score.formatting}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${getProgressColor(score.formatting)}`}
              style={{ width: `${score.formatting}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Structure</span>
            <span className="font-medium">{score.structure}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${getProgressColor(score.structure)}`}
              style={{ width: `${score.structure}%` }}
            />
          </div>
        </div>
      </div>

      {score.suggestions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-warning" />
            Suggestions
          </h4>
          <ul className="space-y-1.5">
            {score.suggestions.slice(0, 3).map((suggestion, index) => (
              <li key={index} className="text-xs text-muted-foreground flex items-start gap-1.5">
                <CheckCircle className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
};
