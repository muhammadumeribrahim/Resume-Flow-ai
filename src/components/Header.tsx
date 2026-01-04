import { FileText, Sparkles, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Header = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
  };

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center shadow-md">
            <FileText className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-lg text-foreground leading-none">
              ResumeAI
            </h1>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">
              ATS-Optimized Resumes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="hidden sm:inline">Powered by AI</span>
          </div>

          {user && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
