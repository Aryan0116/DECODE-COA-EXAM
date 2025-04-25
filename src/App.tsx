import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import TeacherDashboard from "./pages/teacher/Dashboard";
import TeacherAddQuestion from "./pages/teacher/AddQuestion";
import TeacherCreateExam from "./pages/teacher/CreateExam";
import TeacherManageResults from "./pages/teacher/ManageResults";
import StudentDashboard from "./pages/student/Dashboard";
import TakeExam from "./pages/student/TakeExam";
import AdminDashboard from "./pages/admin/Dashboard";

const queryClient = new QueryClient();

// Protected route wrapper component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to appropriate dashboard based on role
    if (user?.role === 'student') {
      return <Navigate to="/student/dashboard" replace />;
    } else if (user?.role === 'teacher') {
      return <Navigate to="/teacher/dashboard" replace />;
    } else if (user?.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }
  
  return children;
};

// Redirect if already authenticated
const AuthRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  
  if (isAuthenticated) {
    // Redirect to appropriate dashboard based on role
    if (user?.role === 'student') {
      return <Navigate to="/student/dashboard" replace />;
    } else if (user?.role === 'teacher') {
      return <Navigate to="/teacher/dashboard" replace />;
    } else if (user?.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }
  
  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          
          {/* Auth routes - redirecting register to login */}
          <Route path="/login" element={
            <AuthRoute>
              <Login />
            </AuthRoute>
          } />
          
          <Route path="/register" element={
            <Navigate to="/login" replace />
          } />
          
          {/* Teacher routes */}
          <Route path="/teacher/dashboard" element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <TeacherDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/teacher/add-question" element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <TeacherAddQuestion />
            </ProtectedRoute>
          } />
          
          <Route path="/teacher/create-exam" element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <TeacherCreateExam />
            </ProtectedRoute>
          } />
          
          <Route path="/teacher/manage-results" element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <TeacherManageResults />
            </ProtectedRoute>
          } />
          
          {/* Student routes */}
          <Route path="/student/dashboard" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/student/take-exam/:examId" element={
            <ProtectedRoute allowedRoles={['student']}>
              <TakeExam />
            </ProtectedRoute>
          } />
          
          {/* Admin routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
