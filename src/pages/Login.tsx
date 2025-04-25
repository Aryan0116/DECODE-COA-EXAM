
import { useEffect } from "react";
import Header from "@/components/layout/Header";
import AuthForm from "@/components/auth/AuthForm";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

const Login = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate(user?.role === "teacher" ? "/teacher/dashboard" : "/student/dashboard");
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-2">
              <div className="bg-blue-100 p-3 rounded-full">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Exam Platform</CardTitle>
            <CardDescription className="text-base">
              Empowering education through effective assessment
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <AuthForm />
          </CardContent>
          
          <div className="text-center text-xs text-gray-500 pb-4">
            <p>© 2025 Exam Platform. All rights reserved.</p>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Login;
