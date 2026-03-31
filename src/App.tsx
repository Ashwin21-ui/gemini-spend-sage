import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import Welcome from "./pages/Welcome";
import Upload from "./pages/Upload";
import Processing from "./pages/Processing";
import Chat from "./pages/Chat";
import Statements from "./pages/Statements";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            {/* Unprotected Routes - No Sidebar */}
            <Route path="/" element={<Welcome />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Protected Routes - No Sidebar */}
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <Upload />
                </ProtectedRoute>
              }
            />
            <Route
              path="/processing"
              element={
                <ProtectedRoute>
                  <Processing />
                </ProtectedRoute>
              }
            />
            
            {/* Statements Route - No Sidebar */}
            <Route
              path="/statements"
              element={
                <ProtectedRoute>
                  <Statements />
                </ProtectedRoute>
              }
            />
            
            {/* Chat Route - With Sidebar */}
            <Route
              path="/chat"
              element={
                <SidebarProvider>
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                </SidebarProvider>
              }
            />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
