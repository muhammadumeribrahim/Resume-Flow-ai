import { Button } from "@/components/ui/button";
import { Download, FileText, File, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ExportButtonsProps {
  onExportPDF: () => void;
  onExportDOCX: () => void;
  onCopyText: () => void;
  disabled?: boolean;
}

export const ExportButtons = ({
  onExportPDF,
  onExportDOCX,
  onCopyText,
  disabled,
}: ExportButtonsProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopyText();
    setCopied(true);
    toast.success("Resume copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="default"
        size="sm"
        onClick={onExportPDF}
        disabled={disabled}
        className="gap-1.5"
      >
        <FileText className="w-4 h-4" />
        PDF
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onExportDOCX}
        disabled={disabled}
        className="gap-1.5"
      >
        <File className="w-4 h-4" />
        DOCX
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        disabled={disabled}
        className="gap-1.5"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4" />
            Copied
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            Copy Text
          </>
        )}
      </Button>
    </div>
  );
};
