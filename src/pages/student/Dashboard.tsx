import { useState, useEffect, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Award, Calendar, Clock, Moon, Sun } from "lucide-react";
import { mockExams, Exam, StudentExamSubmission, Question } from "@/utils/examTypes";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getExams, getExamResults, getQuestions, getLeaderboard } from "@/utils/supabaseStorage";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/hooks/use-theme";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load components to improve initial load time
const StudentExamDetails = lazy(() => import("@/components/student/StudentExamDetails"));
const Leaderboard = lazy(() => import("@/components/leaderboard/Leaderboard"));

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

// Result item component to reduce re-renders
const ResultItem = ({ submission, onViewDetails }) => {
  return (
    <div 
      className="flex items-center justify-between p-4 rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700"
    >
      <div>
        <h3 className="font-medium">{submission.examTitle}</h3>
        <p className="text-sm text-gray-500">
          {new Date(submission.endTime).toLocaleDateString()}
        </p>
        {submission.released && submission.feedback && (
          <p className="text-xs text-blue-600 mt-1">
            Teacher feedback available
          </p>
        )}
      </div>
      {submission.released ? (
        <div className="flex items-center gap-2">
          <span className="text-sm bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-3 py-1 rounded-full">
            {Math.round((submission.score/submission.totalMarks)*100)}%
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(submission)}
          >
            View Details
          </Button>
        </div>
      ) : (
        <span className="text-sm bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 px-3 py-1 rounded-full">
          Pending
        </span>
      )}
    </div>
  );
};

// Skeleton loader for result items
const ResultSkeleton = () => (
  <div className="flex items-center justify-between p-4 rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700 animate-pulse">
    <div className="space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-24" />
    </div>
    <div className="flex items-center gap-2">
      <Skeleton className="h-8 w-12 rounded-full" />
      <Skeleton className="h-8 w-24 rounded-md" />
    </div>
  </div>
);

// Statistic card component
const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4 shadow-sm">
    <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center mb-3`}>
      <Icon className="h-5 w-5" />
    </div>
    <h3 className="text-lg font-bold">{value}</h3>
    <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
  </div>
);

const StudentDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<StudentExamSubmission[]>([]);
  const [examCode, setExamCode] = useState("");
  const [leaderboardExams, setLeaderboardExams] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  
  const [selectedSubmission, setSelectedSubmission] = useState<StudentExamSubmission | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const handleStartExam = () => {
    if (!examCode) {
      toast({
        title: "Exam code required",
        description: "Please enter an exam code to continue.",
        variant: "destructive",
      });
      return;
    }
    
    const exam = exams.find(e => e.secretCode === examCode && e.isActive);
    
    if (!exam) {
      toast({
        title: "Invalid exam code",
        description: "No active exam found with this code.",
        variant: "destructive",
      });
      return;
    }
    
    const alreadyTaken = submissions.some(sub => sub.examId === exam.id);
    if (alreadyTaken) {
      toast({
        title: "Exam already taken",
        description: "You have already submitted this exam.",
        variant: "destructive",
      });
      return;
    }
    
    navigate(`/student/take-exam/${exam.id}`);
  };

  const handleViewDetails = (submission: StudentExamSubmission) => {
    setSelectedSubmission(submission);
    setShowDetails(true);
  };

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "student") {
      navigate("/login");
      return;
    }
    
    let isMounted = true;
    setLoading(true);
    
    const loadData = async () => {
      try {
        // Load data in parallel for better performance
        const [storedExams, storedSubmissions, storedQuestions] = await Promise.all([
          getExams(),
          getExamResults(),
          getQuestions()
        ]);
        
        if (!isMounted) return;
        
        setExams(storedExams.length > 0 ? storedExams : mockExams);
        
        const userSubmissions = storedSubmissions.filter(sub => sub.studentId === user.id);
        setSubmissions(userSubmissions);
        
        setQuestions(storedQuestions);
        
        // Get exam IDs with released leaderboards
        const examsWithLeaderboard = storedExams
          .filter(exam => exam.leaderboardReleased)
          .map(exam => exam.id);
        
        setLeaderboardExams(examsWithLeaderboard);
        
        // Delay setting loading to false to prevent flickering for fast loads
        setTimeout(() => {
          if (isMounted) setLoading(false);
        }, 300);
        
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        if (isMounted) {
          setLoading(false);
          toast({
            title: "Error loading data",
            description: "Please try refreshing the page",
            variant: "destructive",
          });
        }
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user, navigate, toast]);

  // Memo-compatible calculation of statistics
  const statistics = (() => {
    const examsTaken = submissions.length;
    const releasedExams = submissions.filter(sub => sub.released);
    const averageScore = releasedExams.length 
      ? Math.round(releasedExams.reduce((sum, sub) => sum + (sub.score / sub.totalMarks * 100), 0) / releasedExams.length) 
      : 0;
    const totalTime = submissions.reduce((sum, sub) => {
      const start = new Date(sub.startTime).getTime();
      const end = new Date(sub.endTime).getTime();
      return sum + Math.round((end - start) / (1000 * 60));
    }, 0);
    
    return { examsTaken, releasedExams, averageScore, totalTime };
  })();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <Header />
      
      <main className="flex-1 container py-8">
        <div className="flex flex-col gap-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>
              <p className="text-gray-500 dark:text-gray-400">Welcome back, {user?.name}</p>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Card className="glass-morphism animate-fade-in">
                <CardHeader>
                  <CardTitle>Take New Exam</CardTitle>
                  <CardDescription>Enter the exam code provided by your teacher</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Input
                      placeholder="Enter exam code"
                      value={examCode}
                      onChange={(e) => setExamCode(e.target.value)}
                    />
                    <Button onClick={handleStartExam} className="w-full">
                      Start Exam
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-morphism animate-fade-in">
                <CardHeader>
                  <CardTitle>Statistics</CardTitle>
                  <CardDescription>Your exam performance overview</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="grid grid-cols-3 gap-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4 shadow-sm">
                          <Skeleton className="w-10 h-10 rounded-full mb-3" />
                          <Skeleton className="h-6 w-12 mb-1" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <StatCard
                        title="Exams Taken"
                        value={statistics.examsTaken.toString()}
                        icon={Calendar}
                        color="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      />
                      <StatCard
                        title="Average Score"
                        value={`${statistics.averageScore}%`}
                        icon={Award}
                        color="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                      />
                      {/* <StatCard
                        title="Total Time"
                        value={`${statistics.totalTime} mins`}
                        icon={Clock}
                        color="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                      /> */}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="glass-morphism animate-fade-in">
                <CardHeader>
                  <CardTitle>Your Results</CardTitle>
                  <CardDescription>View your exam history and scores</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="all" className="w-full">
                    <TabsList className="w-full grid grid-cols-2">
                      <TabsTrigger value="all">All Results</TabsTrigger>
                      <TabsTrigger value="released">Released Results</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="mt-4">
                      <ScrollArea className="h-[400px]">
                        {loading ? (
                          <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                              <ResultSkeleton key={i} />
                            ))}
                          </div>
                        ) : submissions.length > 0 ? (
                          <div className="space-y-4">
                            {submissions.map((submission) => (
                              <ResultItem 
                                key={submission.id} 
                                submission={submission} 
                                onViewDetails={handleViewDetails} 
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-gray-500">No exam results yet</p>
                          </div>
                        )}
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="released" className="mt-4">
                      <ScrollArea className="h-[400px]">
                        {loading ? (
                          <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                              <ResultSkeleton key={i} />
                            ))}
                          </div>
                        ) : statistics.releasedExams.length > 0 ? (
                          <div className="space-y-4">
                            {statistics.releasedExams.map((submission) => (
                              <ResultItem 
                                key={submission.id} 
                                submission={submission} 
                                onViewDetails={handleViewDetails} 
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-gray-500">No released results yet</p>
                          </div>
                        )}
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {!loading && leaderboardExams.length > 0 && (
                <div className="space-y-4">
                  <Suspense fallback={<LoadingSpinner />}>
                    {leaderboardExams.map(examId => (
                      <Leaderboard key={examId} examId={examId} />
                    ))}
                  </Suspense>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      {selectedSubmission && (
        <Suspense fallback={<LoadingSpinner />}>
          <StudentExamDetails
            submission={selectedSubmission}
            questions={questions}
            open={showDetails}
            onClose={() => setShowDetails(false)}
          />
        </Suspense>
      )}
    </div>
  );
};

export default StudentDashboard;