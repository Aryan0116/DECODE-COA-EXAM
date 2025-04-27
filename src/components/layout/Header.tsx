import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { LogOut, User, Menu, Link as LinkIcon, ExternalLink } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const NavLinks = () => (
    <>
      <Link to="/" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
        Home
      </Link>
      {isAuthenticated && user?.role === "teacher" && (
        <>
          <Link
            to="/teacher/dashboard"
            className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            to="/teacher/add-question"
            className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
          >
            Questions
          </Link>
          <Link
            to="/teacher/create-exam"
            className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
          >
            Create Exam
          </Link>
        </>
      )}
      {isAuthenticated && user?.role === "student" && (
        <Link
          to="/student/dashboard"
          className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
        >
          Dashboard
        </Link>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 shadow-md animate-slide-down relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 animate-gradient-x"></div>
      
      {/* Shimmer effect */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-40 animate-shimmer"></div>
      </div>
      
      <div className="container relative flex h-16 items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2">
          <img src="/favicon.png" alt="DECODE CO-A Logo" className="h-8 w-8" />
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400">
            DECODE CO-A EXAM PORTAL
          </span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-6 items-center">
          <NavLinks />
        </nav>
        
        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
                <SheetDescription>
                  Navigate through the exam portal
                </SheetDescription>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-4">
                <NavLinks />
                <a 
                  href="https://www.coahub.in" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  COAHUB
                </a>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
        
        <div className="flex gap-4 items-center">
          {/* COAHUB Link with Button styling */}
          <a 
  href="https://aryan0116.github.io/DECODE-CO-A/" 
  className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-400 text-white font-medium shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
>
  <ExternalLink className="h-4 w-4" />
  DECODE CO-A
</a>

          
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full h-9 w-9 border-gray-200 bg-white/80">
                  <User className="h-5 w-5" />
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user?.name}</span>
                    <span className="text-xs text-gray-500">{user?.email}</span>
                    <span className="text-xs text-gray-500 capitalize">{user?.role}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user?.role === "teacher" && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/teacher/dashboard">Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/teacher/add-question">Questions</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/teacher/create-exam">Create Exam</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {user?.role === "student" && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/student/dashboard">Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => navigate("/login")} className="bg-gradient-to-r from-blue-600 to-blue-400 hover:shadow-lg transition-all duration-300 hover:scale-105">
              Login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}