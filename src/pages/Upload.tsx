import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Upload as UploadIcon, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
const Upload = () => {
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { token } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isCheckingData, setIsCheckingData] = useState(false);

  const handleGoToChat = async () => {
    setIsCheckingData(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000"}/api/user-data/check`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error("Verification failed");
      
      if (data.has_data && data.latest_account_id) {
        localStorage.setItem("account_id", data.latest_account_id);
        navigate("/chat");
      }
    } catch (err: any) {
      toast({
        title: "No Analysis Data Found",
        description: "Please upload your bank statement below to proceed.",
        variant: "destructive"
      });
    } finally {
      setIsCheckingData(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/csv': ['.csv'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

const handleUpload = async () => {
  if (!file) return;
  setUploading(true);

  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000"}/api/upload-bank-statement`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData,
      }
    );

    const data = await res.json();

    if (!res.ok || !data.status) throw new Error("Upload failed");

    // ✅ Save extracted result and explicitly bind the user's specific backend account scope locally
    sessionStorage.setItem("extractedData", JSON.stringify(data.extracted_json || {}));
    if (data.account_id) {
      localStorage.setItem("account_id", data.account_id);
    }

    navigate("/processing");

  } catch (error) {
    toast({
      title: "Upload failed",
      description: "Please try again.",
      variant: "destructive",
    });
  } finally {
    setUploading(false);
  }
};





  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3">Upload Your Statement</h1>
          <p className="text-muted-foreground mb-4">
            Drag and drop your bank statement or click to browse
          </p>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleGoToChat}
            disabled={isCheckingData}
            className="text-primary hover:text-primary/80"
          >
            {isCheckingData ? "Connecting..." : "Already uploaded? Go straight to Chat"}
          </Button>
        </div>

        {/* Drop Zone */}
        <div
          {...getRootProps()}
          className={`
            relative border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer
            transition-all duration-300 bg-card/50 backdrop-blur-sm
            ${isDragActive 
              ? 'border-primary bg-primary/5 scale-[1.02]' 
              : 'border-border hover:border-primary/50 hover:bg-primary/5'
            }
          `}
        >
          <input {...getInputProps()} />
          
          <div className="space-y-4">
            {!file ? (
              <>
                <div className="flex justify-center">
                  <div className="bg-primary/10 p-6 rounded-2xl">
                    <UploadIcon className="w-12 h-12 text-primary" />
                  </div>
                </div>
                <div>
                  <p className="text-lg font-semibold mb-2">
                    {isDragActive ? "Drop it here!" : "Drop your file here"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse your files
                  </p>
                </div>
                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    PDF
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    CSV
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    TXT
                  </span>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="bg-secondary/10 p-6 rounded-2xl">
                    <CheckCircle2 className="w-12 h-12 text-secondary" />
                  </div>
                </div>
                <div>
                  <p className="text-lg font-semibold mb-1">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                >
                  Remove file
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-accent/10 border border-accent/20 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-accent mb-1">Privacy First</p>
            <p className="text-muted-foreground">
              Your financial data is processed securely and never shared with third parties
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate("/")}
            className="flex-1 rounded-xl"
          >
            Back
          </Button>
          <Button
            size="lg"
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90 rounded-xl"
          >
            {uploading ? "Uploading..." : "Process Statement"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Upload;
