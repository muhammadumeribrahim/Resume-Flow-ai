import { FileText, Sparkles, LogOut, LayoutDashboard, Briefcase, FileStack } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";

export const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div 
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => navigate("/dashboard")}
          >
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

          {user && (
            <nav className="hidden md:flex items-center gap-1">
              <Button
                variant={isActive("/dashboard") ? "secondary" : "ghost"}
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="gap-1.5"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Button>
              <Button
                variant={isActive("/") ? "secondary" : "ghost"}
                size="sm"
                onClick={() => navigate("/")}
                className="gap-1.5"
              >
                <FileText className="w-4 h-4" />
                Create Resume
              </Button>
              <Button
                variant={isActive("/saved-resumes") ? "secondary" : "ghost"}
                size="sm"
                onClick={() => navigate("/saved-resumes")}
                className="gap-1.5"
              >
                <FileStack className="w-4 h-4" />
                Saved
              </Button>
              <Button
                variant={isActive("/job-tracker") ? "secondary" : "ghost"}
                size="sm"
                onClick={() => navigate("/job-tracker")}
                className="gap-1.5"
              >
                <Briefcase className="w-4 h-4" />
                Jobs
              </Button>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground mr-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <span>Powered by AI</span>
          </div>

          <ThemeToggle />

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
