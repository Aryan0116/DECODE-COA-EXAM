
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowRight, Book, PlusCircle, Award, BarChart, Moon, Sun, Trash2 } from "lucide-react";
import { Exam, StudentExamSubmission } from "@/utils/examTypes";
import { getExams, getExamResults, deleteExam } from "@/utils/supabaseStorage";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
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

const TeacherDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<StudentExamSubmission[]>([]);
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!isAuthenticated || user?.role !== "teacher") {
      navigate("/login");
      return;
    }
    
    const fetchData = async () => {
      try {
        // Load data from Supabase
        const storedExams = await getExams();
        const storedSubmissions = await getExamResults();
        
        // Only show exams created by the current teacher
        const teacherExams = storedExams.filter(exam => exam.createdBy === user.id);
        
        setExams(teacherExams.length > 0 ? teacherExams : []);
        setSubmissions(storedSubmissions);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [isAuthenticated, user, navigate, toast]);
  
  // Calculate some stats for the dashboard
  const totalExams = exams.length;
  const activeExams = exams.filter(exam => exam.isActive).length;
  const totalSubmissions = submissions.filter(sub => 
    exams.some(exam => exam.id === sub.examId)
  ).length;
  const pendingResults = submissions.filter(sub => 
    !sub.released && exams.some(exam => exam.id === sub.examId)
  ).length;

  const handleDeleteExam = (exam: Exam) => {
    setExamToDelete(exam);
  };

  const confirmDeleteExam = async () => {
    if (examToDelete) {
      try {
        await deleteExam(examToDelete.id);
        
        // Update local state
        setExams(exams.filter(e => e.id !== examToDelete.id));
        
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
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <Header />
        <div className="flex-1 container py-8 flex items-center justify-center">
          <p className="text-xl">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

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
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                    <Book className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Exams</p>
                    <h3 className="text-2xl font-bold text-blue-700 dark:text-blue-300">{totalExams}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                    <BarChart className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">Active Exams</p>
                    <h3 className="text-2xl font-bold text-green-700 dark:text-green-300">{activeExams}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-900">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
                    <Award className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Submissions</p>
                    <h3 className="text-2xl font-bold text-purple-700 dark:text-purple-300">{totalSubmissions}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="bg-amber-100 dark:bg-amber-900 p-3 rounded-full">
                    <PlusCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">Pending Results</p>
                    <h3 className="text-2xl font-bold text-amber-700 dark:text-amber-300">{pendingResults}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
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
                  <div className="space-y-4">
                    {exams.length > 0 ? (
                      exams.map((exam) => (
                        <div key={exam.id} className="border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">{exam.title}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              exam.isActive 
                                ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300" 
                                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                            }`}>
                              {exam.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            <span>Duration: {exam.duration} minutes</span>
                            <span className="mx-2">•</span>
                            <span>Questions: {exam.questions.length}</span>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-1 rounded-full">
                              Code: {exam.secretCode}
                            </span>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => navigate(`/teacher/edit-exam/${exam.id}`)}
                              >
                                Edit
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
                                onClick={() => handleDeleteExam(exam)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
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
                  </div>
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
