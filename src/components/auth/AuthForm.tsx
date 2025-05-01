
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth, UserRole } from "@/context/AuthContext";
import { Mail, Lock, User, Phone, ShieldCheck, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AuthFormProps {
  mode?: "default" | "teacherRegister";
  onToggleMode?: () => void;
}

export default function AuthForm({ mode = "default", onToggleMode }: AuthFormProps) {
  const { login, register, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [authMode, setAuthMode] = useState<"login" | "studentRegister" | "teacherRegister">("login");
  
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [secretCode, setSecretCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  // Determine role based on registration mode
  const getRole = (): UserRole => {
    switch (authMode) {
      case "teacherRegister":
        return "teacher";
      case "studentRegister":
        return "student";
      default:
        return "student";
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    
    const success = await login(email, password);
    
    if (success) {
      const role = getRole();
      navigate(role === "teacher" ? "/teacher/dashboard" : "/student/dashboard");
    }
  };
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const role = getRole();
    const requiredFields = [name, email, password, confirmPassword, phone];
    
    if (role === 'teacher' && !secretCode) {
      setError("Please enter the teacher verification code.");
      return;
    }
    
    if (requiredFields.some(field => !field)) {
      setError("Please fill in all fields.");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    
    // Add basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    
    const success = await register(
      name, 
      email, 
      password, 
      phone, 
      role, 
      role === 'teacher' ? secretCode : undefined
    );
    
    if (success) {
      toast({
        title: "Registration successful",
        description: "You can now login with your credentials.",
      });
      
      // Go to login after successful registration
      setAuthMode("login");
      
      // Clear form fields
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setPhone("");
      setSecretCode("");
    }
  };

  // Teacher registration form
  if (authMode === "teacherRegister") {
    return (
      <Card className="p-6 border-2 border-blue-100 shadow-md">
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="flex items-center justify-center mb-4">
            <ShieldCheck className="h-10 w-10 text-blue-500 mr-2" />
            <h2 className="text-2xl font-bold text-center">Teacher Registration</h2>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="teacher-name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                id="teacher-name"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="teacher-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                id="teacher-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="teacher-phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                id="teacher-phone"
                type="tel"
                placeholder="+1234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="teacher-secret-code">Verification Code</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 ml-2 text-blue-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="w-[200px]">Teachers must provide the verification code to register. Contact administration for this code.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                id="teacher-secret-code"
                type="text"
                placeholder="Teacher verification code"
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value)}
                className="pl-10"
              />
            </div>
            {/* <p className="text-xs text-muted-foreground">The default test code is: TEACH2025</p> */}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="teacher-password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                id="teacher-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="teacher-confirm-password">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                id="teacher-confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Register as Teacher"}
          </Button>
          
          <Button 
            type="button" 
            variant="outline" 
            className="w-full mt-2" 
            onClick={() => setAuthMode("login")}
            disabled={isLoading}
          >
            Back to Login
          </Button>
        </form>
      </Card>
    );
  }

  // Default login/student registration form
  return (
    <Card className="p-6 border border-gray-100 shadow-md">
      <Tabs 
        value={authMode} 
        onValueChange={(value) => setAuthMode(value as "login" | "studentRegister" | "teacherRegister")}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="login" className="text-sm">Login</TabsTrigger>
          <TabsTrigger value="studentRegister" className="text-sm">Student Sign Up</TabsTrigger>
        </TabsList>
        
        <TabsContent value="login" className="space-y-4 mt-2">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Processing..." : "Login"}
            </Button>
            
            <div className="mt-4 text-center">
              <Button 
                type="button" 
                variant="link" 
                onClick={() => setAuthMode("teacherRegister")}
                className="text-sm"
              >
                Are you a teacher? Register here
              </Button>
            </div>
          </form>
        </TabsContent>
        
        <TabsContent value="studentRegister" className="space-y-4 mt-2">
          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="student-name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="student-name"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="student-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="student-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="student-phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="student-phone"
                  type="tel"
                  placeholder="+1234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="student-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="student-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="student-confirm-password">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="student-confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Register as Student"}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
