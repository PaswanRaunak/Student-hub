import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import AuthGuard from "@/components/guards/AuthGuard";

// Pages
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Notes from "./pages/Notes";
import PYQs from "./pages/PYQs";
import Applications from "./pages/Applications";
import Assignments from "./pages/Assignments";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminNotes from "./pages/admin/AdminNotes";
import AdminPYQs from "./pages/admin/AdminPYQs";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSubjects from "./pages/admin/AdminSubjects";
import AdminTemplates from "./pages/admin/AdminTemplates";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Student Routes */}
            <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
            <Route path="/notes" element={<AuthGuard><Notes /></AuthGuard>} />
            <Route path="/pyqs" element={<AuthGuard><PYQs /></AuthGuard>} />
            <Route path="/applications" element={<AuthGuard><Applications /></AuthGuard>} />
            <Route path="/assignments" element={<AuthGuard><Assignments /></AuthGuard>} />
            <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
            
            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={<AuthGuard requireAdmin><AdminDashboard /></AuthGuard>} />
            <Route path="/admin/notes" element={<AuthGuard requireAdmin><AdminNotes /></AuthGuard>} />
            <Route path="/admin/pyqs" element={<AuthGuard requireAdmin><AdminPYQs /></AuthGuard>} />
            <Route path="/admin/users" element={<AuthGuard requireAdmin><AdminUsers /></AuthGuard>} />
            <Route path="/admin/subjects" element={<AuthGuard requireAdmin><AdminSubjects /></AuthGuard>} />
            <Route path="/admin/templates" element={<AuthGuard requireAdmin><AdminTemplates /></AuthGuard>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
