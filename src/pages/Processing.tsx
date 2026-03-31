import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, CheckCircle2, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const loadingMessages = [
  "Reading your statement...",
  "Extracting transactions...",
  "Analyzing spending patterns...",
  "Categorizing expenses...",
  "Generating embeddings...",
  "Indexing data...",
  "Almost there...",
];

const Processing = () => {
  const navigate = useNavigate();
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // Rotate loading messages
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);

    // Smooth Progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + Math.random() * 3, 95));
    }, 300);

    // Check for data completion (sessionStorage or timeout fallback)
    const checkDataInterval = setInterval(() => {
      const data = sessionStorage.getItem("extractedData");
      const account_id = localStorage.getItem("account_id");
      
      if (data && account_id) {
        clearInterval(checkDataInterval);
        clearInterval(progressInterval);
        clearInterval(messageInterval);
        setProgress(100);

        // Small delay to show "All Set!" before navigating
        setTimeout(() => {
          navigate("/chat");
        }, 1500);
      }
    }, 500);

    // 100-second timeout — if data isn't ready by then, show error
    const timeoutId = setTimeout(() => {
      clearInterval(checkDataInterval);
      clearInterval(progressInterval);
      clearInterval(messageInterval);
      setHasError(true);
      setErrorMessage(
        "Processing took longer than expected. Please try uploading again or proceed to chat."
      );
      setProgress(Math.min(progress, 90));
    }, 100000);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
      clearInterval(checkDataInterval);
      clearTimeout(timeoutId);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8 animate-fade-in">
        {/* Animated Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full blur-3xl opacity-30 animate-pulse" />
            <div className="relative">
              {!hasError && progress < 100 ? (
                <Loader2 className="w-24 h-24 text-primary animate-spin" />
              ) : hasError ? (
                <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-full">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 4v2" />
                  </svg>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-secondary to-secondary/80 p-6 rounded-full">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">
            {hasError ? "Processing Paused" : progress < 100 ? "Processing Your Data" : "All Set!"}
          </h2>
          <p className="text-lg text-muted-foreground animate-pulse">
            {hasError ? errorMessage : progress < 100 ? loadingMessages[messageIndex] : "Taking you to chat..."}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary via-secondary to-accent transition-all duration-300 ease-out"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          {!hasError && <p className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</p>}
        </div>

        {/* Error Recovery Options */}
        {hasError && (
          <div className="flex gap-3 flex-col">
            <Button
              onClick={() => navigate("/chat")}
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 rounded-xl"
            >
              Go to Chat Anyway
            </Button>
            <Button
              onClick={() => navigate("/upload")}
              variant="outline"
              className="rounded-xl border-primary/20 hover:border-primary/50"
            >
              Upload Again
            </Button>
          </div>
        )}

        {/* Fun Facts */}
        {!hasError && (
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
              <div className="text-left text-sm">
                <p className="font-semibold mb-1">Did you know?</p>
                <p className="text-muted-foreground">
                  Tracking your expenses can help you save up to 20% more each month!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Processing;
