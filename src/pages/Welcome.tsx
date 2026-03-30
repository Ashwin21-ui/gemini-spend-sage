import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Sparkles, TrendingUp, PiggyBank, Target, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Welcome = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, token } = useAuth();
  const { toast } = useToast();
  const [isCheckingData, setIsCheckingData] = useState(false);

  const handleGoToChat = async () => {
    setIsCheckingData(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000"}/api/user-data/check`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Verification failed");
      }
      if (data.has_data && data.latest_account_id) {
        localStorage.setItem("account_id", data.latest_account_id);
        navigate("/chat");
      }
    } catch (err: any) {
      toast({
        title: "No Analysis Data Found",
        description: "Please upload a bank statement inside the dashboard first to prime your AI context.",
        variant: "destructive"
      });
      navigate("/upload");
    } finally {
      setIsCheckingData(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      {/* Top Right Auth Boundary */}
      {isAuthenticated && (
        <div className="absolute top-6 right-6 z-50">
          <Button 
            onClick={logout}
            className="bg-accent hover:bg-accent/90 text-white rounded-full px-5 shadow-sm transition-all"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      )}

      <div className="max-w-4xl w-full animate-fade-in">
        <div className="text-center space-y-8">
          {/* Hero Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full blur-2xl opacity-20 animate-pulse-glow" />
              <div className="relative bg-gradient-to-br from-primary to-secondary p-6 rounded-3xl shadow-lg">
                <Sparkles className="w-16 h-16 text-primary-foreground" />
              </div>
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-4 relative">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              {isAuthenticated ? `Hi ${user?.username}!` : "Your Personal Finance Assistant"}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Upload your bank statements and let AI help you understand your spending,
              track patterns, and make smarter financial decisions.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border hover:shadow-md transition-all hover:scale-105">
              <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Smart Analysis</h3>
              <p className="text-sm text-muted-foreground">
                AI-powered insights into your spending patterns
              </p>
            </div>

            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border hover:shadow-md transition-all hover:scale-105">
              <div className="bg-secondary/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <PiggyBank className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="font-semibold mb-2">Track Spending</h3>
              <p className="text-sm text-muted-foreground">
                Understand where your money goes each month
              </p>
            </div>

            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border hover:shadow-md transition-all hover:scale-105">
              <div className="bg-accent/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Target className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold mb-2">Set Goals</h3>
              <p className="text-sm text-muted-foreground">
                Create budgets and reach your financial targets
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated ? (
              <>
                <Button
                  size="lg"
                  onClick={() => navigate("/upload")}
                  className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-lg px-8 py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  Upload Statement
                  <Sparkles className="ml-2 w-5 h-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleGoToChat}
                  disabled={isCheckingData}
                  className="text-lg px-8 py-6 rounded-2xl shadow-sm hover:shadow-md transition-all border-primary/20 hover:border-primary/50"
                >
                  {isCheckingData ? "Verifying..." : "Go to Chat"}
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="lg"
                  onClick={() => navigate("/signup")}
                  className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-lg px-8 py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  Get Started
                  <Sparkles className="ml-2 w-5 h-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/login")}
                  className="text-lg px-8 py-6 rounded-2xl shadow-sm hover:shadow-md transition-all border-border"
                >
                  Log In
                </Button>
              </>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            Supports PDF, CSV, and TXT bank statement formats
          </p>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
