import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { LogIn, Eye, EyeOff, ShieldCheck, KeyRound } from "lucide-react";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";

const Login = () => {
  // Step 1: credentials
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Step 2: OTP
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Forgot password flow
  const [forgotPasswordStep, setForgotPasswordStep] = useState<"email" | "otp" | "password" | null>(null);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const forgotOtpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend cooldown
  const [resendCooldown, setResendCooldown] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // Step 1 — Submit credentials, trigger OTP send
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Validation Error", description: "Email and password are required.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Invalid credentials");

      toast({ title: "OTP Sent!", description: `A verification code has been sent to ${email}.` });
      setStep("otp");
      setResendCooldown(60);
    } catch (err: any) {
      toast({
        title: "Login Failed",
        description: err.message.includes("not found") ? "User does not exist. Please sign up." : err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2 — Verify OTP
  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length < 6) {
      toast({ title: "Invalid Code", description: "Please enter the full 6-digit code.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp_code: code, purpose: "login" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "OTP verification failed");

      login(data.access_token, { user_id: data.user_id, username: data.username, email: data.email });
      toast({ title: `Welcome back, ${data.username}!`, description: "You have successfully logged in." });
      navigate("/");
    } catch (err: any) {
      toast({ title: "Verification Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "login" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to resend OTP");
      toast({ title: "New Code Sent", description: `A new OTP has been sent to ${email}.` });
      setResendCooldown(60);
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } catch (err: any) {
      toast({ title: "Resend Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // OTP input box handler
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Forgot Password - Step 1: Send OTP
  const handleForgotPasswordEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast({ title: "Validation Error", description: "Please enter your email.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to send OTP");
      toast({ title: "OTP Sent!", description: `A verification code has been sent to ${forgotEmail}.` });
      setForgotPasswordStep("otp");
      setResendCooldown(60);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password - Step 2: Verify OTP and set new password
  const handleForgotPasswordOtp = async () => {
    const code = forgotOtp.join("");
    if (code.length < 6) {
      toast({ title: "Invalid Code", description: "Please enter the full 6-digit code.", variant: "destructive" });
      return;
    }
    setForgotPasswordStep("password");
  };

  // Forgot Password - Step 3: Reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      toast({ title: "Validation Error", description: "Please enter both passwords.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Validation Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "Validation Error", description: "Password must be at least 8 characters long.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const otpCode = forgotOtp.join("");
      const res = await fetch(`${BACKEND}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail,
          otp_code: otpCode,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Password reset failed");
      toast({ title: "Success!", description: "Your password has been reset. Please login with your new password." });
      // Reset forgot password state and go back to login
      setForgotPasswordStep(null);
      setForgotEmail("");
      setForgotOtp(["", "", "", "", "", ""]);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password OTP input handler
  const handleForgotOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...forgotOtp];
    newOtp[index] = value.slice(-1);
    setForgotOtp(newOtp);
    if (value && index < 5) forgotOtpRefs.current[index + 1]?.focus();
  };

  const handleForgotOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !forgotOtp[index] && index > 0) {
      forgotOtpRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="max-w-md w-full animate-fade-in shadow-xl border-primary/20 bg-card/50 backdrop-blur-sm">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-2">
            <div className={`p-4 rounded-full ${
              forgotPasswordStep === "email" ? "bg-accent/10" :
              forgotPasswordStep === "otp" ? "bg-secondary/10" :
              forgotPasswordStep === "password" ? "bg-accent/10" :
              step === "otp" ? "bg-secondary/10" : "bg-primary/10"
            }`}>
              {forgotPasswordStep ? <KeyRound className="w-8 h-8 text-accent" /> :
               step === "otp" ? <ShieldCheck className="w-8 h-8 text-secondary" /> :
               <LogIn className="w-8 h-8 text-primary" />
              }
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {forgotPasswordStep === "email" ? "Reset Password" :
             forgotPasswordStep === "otp" ? "Verify Your Email" :
             forgotPasswordStep === "password" ? "Set New Password" :
             step === "otp" ? "Verify Your Email" : "Welcome Back"}
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            {forgotPasswordStep === "email" ? "Enter your email to receive a reset code" :
             forgotPasswordStep === "otp" ? `Enter the 6-digit code sent to ${forgotEmail}` :
             forgotPasswordStep === "password" ? "Create your new password" :
             step === "otp" ? `Enter the 6-digit code sent to ${email}` :
             "Sign in to access your financial insights"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {forgotPasswordStep === "email" ? (
            <form onSubmit={handleForgotPasswordEmail} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email address</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="you@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="bg-background/50"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all shadow-md"
                disabled={isLoading}
              >
                {isLoading ? "Sending OTP..." : "Send Reset Code"}
              </Button>
            </form>
          ) : forgotPasswordStep === "otp" ? (
            <div className="space-y-6">
              <div className="flex justify-center gap-3">
                {forgotOtp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { forgotOtpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleForgotOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleForgotOtpKeyDown(i, e)}
                    className="w-11 h-14 text-center text-xl font-bold border-2 rounded-xl bg-background/50 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                ))}
              </div>
              <Button
                onClick={handleForgotPasswordOtp}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all shadow-md"
                disabled={isLoading || forgotOtp.join("").length < 6}
              >
                {isLoading ? "Verifying..." : "Verify Code"}
              </Button>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Didn't receive the code?</p>
                <button
                  onClick={() => {
                    setResendCooldown(60);
                    toast({ title: "New Code Sent", description: `A new OTP has been sent to ${forgotEmail}.` });
                  }}
                  disabled={resendCooldown > 0 || isLoading}
                  className="text-sm font-medium text-primary hover:underline disabled:text-muted-foreground disabled:no-underline disabled:cursor-not-allowed transition-colors"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                </button>
              </div>
              <button
                onClick={() => setForgotPasswordStep("email")}
                className="w-full text-sm text-muted-foreground hover:text-foreground text-center transition-colors"
              >
                ← Back
              </button>
            </div>
          ) : forgotPasswordStep === "password" ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-background/50 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-background/50 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all shadow-md"
                disabled={isLoading}
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setForgotPasswordStep(null);
                  setForgotEmail("");
                  setForgotOtp(["", "", "", "", "", ""]);
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="w-full text-sm text-muted-foreground hover:text-foreground text-center transition-colors"
              >
                ← Back to login
              </button>
            </form>
          ) : step === "credentials" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotPasswordStep("email");
                      setStep("credentials");
                    }}
                    className="text-xs text-primary hover:underline transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-background/50 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all shadow-md"
                disabled={isLoading}
              >
                {isLoading ? "Sending OTP..." : "Continue"}
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-center gap-3">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-11 h-14 text-center text-xl font-bold border-2 rounded-xl bg-background/50 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                ))}
              </div>
              <Button
                onClick={handleVerifyOtp}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all shadow-md"
                disabled={isLoading || otp.join("").length < 6}
              >
                {isLoading ? "Verifying..." : "Verify & Sign In"}
              </Button>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Didn't receive the code?</p>
                <button
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || isLoading}
                  className="text-sm font-medium text-primary hover:underline disabled:text-muted-foreground disabled:no-underline disabled:cursor-not-allowed transition-colors"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                </button>
              </div>
              <button
                onClick={() => { setStep("credentials"); setOtp(["", "", "", "", "", ""]); }}
                className="w-full text-sm text-muted-foreground hover:text-foreground text-center transition-colors"
              >
                ← Back to login
              </button>
            </div>
          )}
        </CardContent>

        {step === "credentials" && !forgotPasswordStep && (
          <CardFooter className="flex justify-center border-t border-border/50 pt-4 mt-2">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default Login;
