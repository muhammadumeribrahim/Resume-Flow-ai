import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { FileText, Sparkles, Loader2 } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        navigate("/", { replace: true });
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate("/", { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const validateInputs = (isSignUp: boolean) => {
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      toast.error(emailResult.error.errors[0].message);
      return false;
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      toast.error(passwordResult.error.errors[0].message);
      return false;
    }

    if (isSignUp && password !== confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }

    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs(false)) return;

    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("Invalid email or password. Please try again.");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Welcome back!");
    }
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs(true)) return;

    setIsLoading(true);
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      if (error.message.includes("already registered")) {
        toast.error("This email is already registered. Please log in instead.");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Account created! You can now use the app.");
    }
    setIsLoading(false);
  };

  const handleResetPassword = async () => {
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      toast.error("Please enter your email address first");
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth`,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password reset email sent! Check your inbox.");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen gradient-surface flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass-effect border-border/50">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <FileText className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-heading">Resume Optimizer</CardTitle>
            <CardDescription className="flex items-center justify-center gap-1.5 mt-2">
              <Sparkles className="w-4 h-4" />
              AI-Powered ATS Optimization
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Log In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="text-sm text-primary hover:underline"
                    disabled={isLoading}
                  >
                    Forgot password?
                  </button>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Log In"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="text-xs text-muted-foreground text-center mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
