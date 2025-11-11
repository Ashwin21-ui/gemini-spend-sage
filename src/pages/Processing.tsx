import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, CheckCircle2, Sparkles } from "lucide-react";

const loadingMessages = [
  "Reading your statement...",
  "Extracting transactions...",
  "Analyzing spending patterns...",
  "Categorizing expenses...",
  "Generating insights...",
  "Almost there...",
];

const Processing = () => {
  const navigate = useNavigate();
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Rotate loading messages
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 1500);

    // Smooth Progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 2, 100));
    }, 100);

    // ✅ Check backend completion
    const checkDataInterval = setInterval(() => {
      const data = sessionStorage.getItem("extractedData");
      if (data) {
        clearInterval(checkDataInterval);
        clearInterval(progressInterval);
        setProgress(100); // instantly finish progress bar

        // Small delay to show "All Set!" before navigating
        setTimeout(() => {
          navigate("/chat");
        }, 1000);
      }
    }, 500);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
      clearInterval(checkDataInterval);
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
              {progress < 100 ? (
                <Loader2 className="w-24 h-24 text-primary animate-spin" />
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
            {progress < 100 ? "Processing Your Data" : "All Set!"}
          </h2>
          <p className="text-lg text-muted-foreground animate-pulse">
            {progress < 100 ? loadingMessages[messageIndex] : "Taking you to chat..."}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary via-secondary to-accent transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">{progress}% Complete</p>
        </div>

        {/* Fun Facts */}
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
      </div>
    </div>
  );
};

export default Processing;
