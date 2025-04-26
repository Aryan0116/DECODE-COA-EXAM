import { useState, useEffect, useMemo, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowRight, Book, PlusCircle, Award, BarChart, Moon, Sun, Trash2 } from "lucide-react";
import { Exam, StudentExamSubmission } from "@/utils/examTypes";
import { getExams, getExamResults, deleteExam } from "@/utils/supabaseStorage";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton component
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Lazy-loaded components
const StatCard = lazy(() => import("@/components/dashboard/StatCard"));
const ExamCard = lazy(() => import("@/components/dashboard/ExamCard"));

// Loading skeleton components
const StatCardSkeleton = () => (
  <Card className="animate-pulse">
    <CardContent className="pt-6">
      <div className="flex items-center gap-4">
        <div className="bg-gray-200 dark:bg-gray-700 p-3 rounded-full">
          <div className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const ExamsListSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="border dark:border-gray-700 rounded-lg p-4">
        <div className="flex justify-between mb-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="flex gap-2 mb-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex justify-between mt-4">
          <Skeleton className="h-6 w-24 rounded-full" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Main component with optimizations
const TeacherDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<StudentExamSubmission[]>([]);
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState(false);
  
  // Authentication check and data fetching
  useEffect(() => {
    if (!isAuthenticated || user?.role !== "teacher") {
      navigate("/login");
      return;
    }
    
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        // Parallel data fetching
        const [storedExams, storedSubmissions] = await Promise.all([
          getExams(),
          getExamResults()
        ]);
        
        if (isMounted) {
          // Only show exams created by the current teacher
          const teacherExams = storedExams.filter(exam => exam.createdBy === user.id);
          
          setExams(teacherExams);
          setSubmissions(storedSubmissions);
          setDataError(false);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        if (isMounted) {
          setDataError(true);
          toast({
            title: "Error",
            description: "Failed to load dashboard data. Please try again later.",
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user, navigate, toast]);
  
  // Memoized calculations to prevent recalculation on re-renders
  const dashboardStats = useMemo(() => {
    const totalExams = exams.length;
    const activeExams = exams.filter(exam => exam.isActive).length;
    const totalSubmissions = submissions.filter(sub => 
      exams.some(exam => exam.id === sub.examId)
    ).length;
    const pendingResults = submissions.filter(sub => 
      !sub.released && exams.some(exam => exam.id === sub.examId)
    ).length;
    
    return { totalExams, activeExams, totalSubmissions, pendingResults };
  }, [exams, submissions]);
  
  const handleDeleteExam = (exam: Exam) => {
    setExamToDelete(exam);
  };

  const confirmDeleteExam = async () => {
    if (!examToDelete) return;
    
    try {
      await deleteExam(examToDelete.id);
      
      // Update local state without refetching
      setExams(prevExams => prevExams.filter(e => e.id !== examToDelete.id));
      
      toast({
        title: "Exam deleted",
        description: `${examToDelete.title} has been deleted successfully.`,
      });
    } catch (error) {
      console.error("Error deleting exam:", error);
      toast({
        title: "Error",
        description: "Failed to delete exam. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setExamToDelete(null);
    }
  };

  // Full-page loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <Header />
        <div className="flex-1 container py-8">
          <div className="flex flex-col gap-8 animate-pulse">
            <div className="flex justify-between items-center">
              <div>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => <StatCardSkeleton key={i} />)}
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-40 mb-2" />
                  <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-40 mb-2" />
                  <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent>
                  <ExamsListSkeleton />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (dataError) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <Header />
        <div className="flex-1 container py-8 flex flex-col items-center justify-center">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold mb-4">Unable to Load Dashboard</h2>
            <p className="mb-6">We're having trouble loading your dashboard data. Please try again later.</p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { totalExams, activeExams, totalSubmissions, pendingResults } = dashboardStats;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <Header />
      
      <main className="flex-1 container py-8">
        <div className="flex flex-col gap-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
              <p className="text-gray-500 dark:text-gray-400">Welcome, {user?.name}</p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Suspense fallback={<StatCardSkeleton />}>
              <StatCard
                title="Total Exams"
                value={totalExams}
                icon={<Book className="h-6 w-6" />}
                color="blue"
              />
            </Suspense>
            
            <Suspense fallback={<StatCardSkeleton />}>
              <StatCard
                title="Active Exams"
                value={activeExams}
                icon={<BarChart className="h-6 w-6" />}
                color="green"
              />
            </Suspense>
            
            <Suspense fallback={<StatCardSkeleton />}>
              <StatCard
                title="Submissions"
                value={totalSubmissions}
                icon={<Award className="h-6 w-6" />}
                color="purple"
              />
            </Suspense>
            
            <Suspense fallback={<StatCardSkeleton />}>
              <StatCard
                title="Pending Results"
                value={pendingResults}
                icon={<PlusCircle className="h-6 w-6" />}
                color="amber"
              />
            </Suspense>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Quick Actions Card */}
            <Card className="glass-morphism animate-fade-in dark:bg-gray-800/50">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Manage your exams and questions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => navigate("/teacher/create-exam")}
                  className="w-full justify-between"
                  size="lg"
                >
                  <span>Create New Exam</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => navigate("/teacher/add-question")}
                  className="w-full justify-between"
                  size="lg"
                >
                  <span>Add Questions</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => navigate("/teacher/manage-results")}
                  className="w-full justify-between"
                  size="lg"
                  variant={pendingResults > 0 ? "default" : "outline"}
                >
                  <span>Manage Results</span>
                  {pendingResults > 0 && (
                    <span className="bg-white text-primary rounded-full px-2 py-0.5 text-xs font-bold ml-2 dark:bg-gray-900">
                      {pendingResults}
                    </span>
                  )}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
            
            {/* Exams List Card */}
            <Card className="glass-morphism animate-fade-in dark:bg-gray-800/50" style={{ animationDelay: "0.1s" }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>Your Exams</CardTitle>
                  <CardDescription>
                    Manage your created exams
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[320px] pr-4">
                  <Suspense fallback={<ExamsListSkeleton />}>
                    {exams.length > 0 ? (
                      <div className="space-y-4">
                        {exams.map((exam) => (
                          <ExamCard 
                            key={exam.id}
                            exam={exam}
                            onEdit={() => navigate(`/teacher/edit-exam/${exam.id}`)}
                            onDelete={() => handleDeleteExam(exam)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400">No exams created yet</p>
                        <Button 
                          onClick={() => navigate("/teacher/create-exam")} 
                          variant="outline" 
                          className="mt-4"
                        >
                          Create Your First Exam
                        </Button>
                      </div>
                    )}
                  </Suspense>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <AlertDialog open={!!examToDelete} onOpenChange={() => setExamToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the exam "{examToDelete?.title}". 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteExam} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TeacherDashboard;