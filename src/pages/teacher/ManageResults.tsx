import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, LineChart, PieChart } from "lucide-react";
import { StudentExamSubmission, Exam, Question } from "@/utils/examTypes";
import {
  getExamResults,
  saveExamResult,
  addFeedbackToResult,
  releaseExamResults,
  getExams,
  toggleLeaderboard,
  calculatePerformanceAnalytics,
  getExamPerformanceStats,
  getQuestions,
} from "@/utils/supabaseStorage";
import Leaderboard from "@/components/review/Leaderboard";
import FeedbackForm from "@/components/review/FeedbackForm";
import PerformanceAnalytics from "@/components/review/PerformanceAnalytics";
import PerformanceStats from "@/components/review/PerformanceStats";
import StudentExamDetails from "@/components/student/StudentExamDetails";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';

const ManageResults = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [exams, setExams] = useState<Exam[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [submissions, setSubmissions] = useState<StudentExamSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<StudentExamSubmission | null>(null);
  const [loading, setLoading] = useState(false);
  const [performanceAnalytics, setPerformanceAnalytics] = useState<any>(null);
  const [examPerformanceStats, setExamPerformanceStats] = useState<any>(null);
  
  const [selectedSubmissionIds, setSelectedSubmissionIds] = useState<string[]>([]);
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [bulkReleaseValue, setBulkReleaseValue] = useState(true);
  
  const [activeTab, setActiveTab] = useState("overview");
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  const [scoreDistribution, setScoreDistribution] = useState<{name: string; value: number}[]>([]);
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "teacher") {
      navigate("/login");
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const examList = await getExams();
        setExams(examList);
        
        const allQuestions = await getQuestions();
        setQuestions(allQuestions);

        if (selectedExamId) {
          const examResults = await getExamResults();
          const filteredSubmissions = examResults.filter(result => result.examId === selectedExamId);
          setSubmissions(filteredSubmissions);

          const exam = examList.find(e => e.id === selectedExamId);
          setSelectedExam(exam || null);

          const analytics = await calculatePerformanceAnalytics(selectedExamId);
          setPerformanceAnalytics(analytics);

          const performanceStats = await getExamPerformanceStats(selectedExamId);
          setExamPerformanceStats(performanceStats);
          
          if (filteredSubmissions.length > 0) {
            const distribution = generateScoreDistribution(filteredSubmissions);
            setScoreDistribution(distribution);
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Error loading data",
          description: "Failed to load exams and submissions. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, user, navigate, toast, selectedExamId]);

  const generateScoreDistribution = (submissions: StudentExamSubmission[]) => {
    const ranges = [
      { min: 0, max: 20, name: '0-20%' },
      { min: 21, max: 40, name: '21-40%' },
      { min: 41, max: 60, name: '41-60%' },
      { min: 61, max: 80, name: '61-80%' },
      { min: 81, max: 100, name: '81-100%' }
    ];
    
    const distribution = ranges.map(range => {
      const count = submissions.filter(sub => {
        const percentage = (sub.score / sub.totalMarks) * 100;
        return percentage >= range.min && percentage <= range.max;
      }).length;
      
      return {
        name: range.name,
        value: count
      };
    });
    
    return distribution;
  };

  const handleExamChange = (examId: string) => {
    setSelectedExamId(examId);
    setSelectedSubmissionIds([]);
  };

  const handleViewSubmission = (submission: StudentExamSubmission) => {
    setSelectedSubmission(submission);
    setShowFeedbackForm(false);
  };

  const handleAddFeedback = (submission: StudentExamSubmission) => {
    setSelectedSubmission(submission);
    setShowFeedbackForm(true);
  };

  const handleSubmitFeedback = async (feedback: string) => {
    if (!selectedSubmission) return;

    try {
      await addFeedbackToResult(selectedSubmission.id, feedback);
      const updatedSubmissions = submissions.map(submission =>
        submission.id === selectedSubmission.id ? { ...submission, feedback } : submission
      );
      setSubmissions(updatedSubmissions);
      setSelectedSubmission({ ...selectedSubmission, feedback });
      setShowFeedbackForm(false);
      
      toast({
        title: "Feedback submitted",
        description: "Your feedback has been saved successfully and will be visible to the student.",
      });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error submitting feedback",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReleaseResults = async (submissionId: string, released: boolean) => {
    try {
      await releaseExamResults(submissionId, released);
      const updatedSubmissions = submissions.map(submission =>
        submission.id === submissionId ? { ...submission, released } : submission
      );
      setSubmissions(updatedSubmissions);
      if (selectedSubmission && selectedSubmission.id === submissionId) {
        setSelectedSubmission({ ...selectedSubmission, released });
      }
      toast({
        title: released ? "Results released" : "Results hidden",
        description: released 
          ? "The exam results have been released to the student."
          : "The exam results have been hidden from the student.",
      });
    } catch (error) {
      console.error("Error toggling result visibility:", error);
      toast({
        title: "Error updating results",
        description: "Failed to update the exam results visibility. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleLeaderboard = async (examId: string, released: boolean) => {
    try {
      await toggleLeaderboard(examId, released);
      const updatedExams = exams.map(exam =>
        exam.id === examId ? { ...exam, leaderboardReleased: released } : exam
      );
      setExams(updatedExams);
      if (selectedExam && selectedExam.id === examId) {
        setSelectedExam({ ...selectedExam, leaderboardReleased: released });
      }
      toast({
        title: released ? "Leaderboard released" : "Leaderboard hidden",
        description: released 
          ? "The leaderboard is now visible to students."
          : "The leaderboard is now hidden from students.",
      });
    } catch (error) {
      console.error("Error toggling leaderboard:", error);
      toast({
        title: "Error toggling leaderboard",
        description: "Failed to update the leaderboard status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSelectSubmission = (submissionId: string, checked: boolean) => {
    if (checked) {
      setSelectedSubmissionIds(prev => [...prev, submissionId]);
    } else {
      setSelectedSubmissionIds(prev => prev.filter(id => id !== submissionId));
    }
  };

  const handleSelectAllSubmissions = (checked: boolean) => {
    if (checked) {
      const allIds = submissions.map(submission => submission.id);
      setSelectedSubmissionIds(allIds);
    } else {
      setSelectedSubmissionIds([]);
    }
  };

  const handleBulkReleaseAction = async () => {
    setLoading(true);
    try {
      for (const submissionId of selectedSubmissionIds) {
        await releaseExamResults(submissionId, bulkReleaseValue);
      }
      
      const updatedSubmissions = submissions.map(submission =>
        selectedSubmissionIds.includes(submission.id) 
          ? { ...submission, released: bulkReleaseValue } 
          : submission
      );
      setSubmissions(updatedSubmissions);
      
      if (selectedSubmission && selectedSubmissionIds.includes(selectedSubmission.id)) {
        setSelectedSubmission({ ...selectedSubmission, released: bulkReleaseValue });
      }
      
      toast({
        title: "Bulk update complete",
        description: `Successfully ${bulkReleaseValue ? 'released' : 'hid'} results for ${selectedSubmissionIds.length} submissions.`,
      });
      setBulkActionDialogOpen(false);
    } catch (error) {
      console.error("Error performing bulk release:", error);
      toast({
        title: "Error updating results",
        description: "Failed to update all selected results. Some may have been updated.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1 container py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manage Results</h1>
            <p className="text-gray-500">View and manage student exam submissions</p>
          </div>
          <Button onClick={() => navigate("/teacher/dashboard")}>
            Back to Dashboard
          </Button>
        </div>

        <div className="mt-8">
          <Label htmlFor="exam-select">Select Exam</Label>
          <Select onValueChange={handleExamChange} value={selectedExamId || undefined}>
            <SelectTrigger id="exam-select">
              <SelectValue placeholder="Select an exam" />
            </SelectTrigger>
            <SelectContent>
              {exams.map((exam) => (
                <SelectItem key={exam.id} value={exam.id}>
                  {exam.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedExamId && (
          <Tabs defaultValue="overview" className="mt-8" onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="overview">
                <BarChart className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="performance">
                <LineChart className="h-4 w-4 mr-2" />
                Performance
              </TabsTrigger>
              <TabsTrigger value="leaderboard">
                <PieChart className="h-4 w-4 mr-2" />
                Leaderboard
              </TabsTrigger>
              <TabsTrigger value="submissions">
                <BarChart className="h-4 w-4 mr-2" />
                Submissions
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>Exam Overview</CardTitle>
                  <CardDescription>
                    {selectedExam?.title} - {submissions.length} submissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium mb-4">Score Distribution</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={scoreDistribution}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {scoreDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-4">Performance Summary</h3>
                      {performanceAnalytics && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <Card>
                              <CardHeader className="p-4">
                                <CardTitle className="text-lg">Avg. Score</CardTitle>
                              </CardHeader>
                              <CardContent className="p-4 pt-0">
                                <p className="text-3xl font-bold">{performanceAnalytics.averageScore.toFixed(1)}</p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardHeader className="p-4">
                                <CardTitle className="text-lg">Submissions</CardTitle>
                              </CardHeader>
                              <CardContent className="p-4 pt-0">
                                <p className="text-3xl font-bold">{performanceAnalytics.totalSubmissions}</p>
                              </CardContent>
                            </Card>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <Card>
                              <CardHeader className="p-4">
                                <CardTitle className="text-lg">Highest</CardTitle>
                              </CardHeader>
                              <CardContent className="p-4 pt-0">
                                <p className="text-3xl font-bold">{performanceAnalytics.highestScore}</p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardHeader className="p-4">
                                <CardTitle className="text-lg">Lowest</CardTitle>
                              </CardHeader>
                              <CardContent className="p-4 pt-0">
                                <p className="text-3xl font-bold">{performanceAnalytics.lowestScore}</p>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="performance">
              <div className="space-y-8">
                {performanceAnalytics && (
                  <PerformanceAnalytics analytics={performanceAnalytics} />
                )}

                <PerformanceStats stats={examPerformanceStats} />
              </div>
            </TabsContent>
            
            <TabsContent value="leaderboard">
              {selectedExam && (
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-gray-500">
                      Enable the leaderboard to let students see how they rank
                    </p>
                    <div className="flex items-center gap-2">
                      <span>
                        {selectedExam.leaderboardReleased ? "Visible" : "Hidden"}
                      </span>
                      <Switch
                        checked={selectedExam.leaderboardReleased}
                        onCheckedChange={(checked) => handleToggleLeaderboard(selectedExam.id, checked)}
                      />
                    </div>
                  </div>
                  <Leaderboard examId={selectedExam.id} />
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="submissions">
              {submissions.length > 0 && (
                <div>
                  <div className="bg-white p-4 mb-4 rounded-lg shadow flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="select-all" 
                        checked={selectedSubmissionIds.length === submissions.length && submissions.length > 0}
                        onCheckedChange={checked => handleSelectAllSubmissions(!!checked)}
                      />
                      <Label htmlFor="select-all">Select All</Label>
                    </div>
                    <Button 
                      onClick={() => setBulkActionDialogOpen(true)}
                      disabled={selectedSubmissionIds.length === 0}
                      variant="outline"
                    >
                      Bulk Actions ({selectedSubmissionIds.length})
                    </Button>
                  </div>
                  
                  <Table>
                    <TableCaption>Student submissions for {selectedExam?.title}</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Roll Number</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Released</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submissions.map((submission) => (
                        <TableRow key={submission.id}>
                          <TableCell>
                            <Checkbox 
                              checked={selectedSubmissionIds.includes(submission.id)}
                              onCheckedChange={checked => handleSelectSubmission(submission.id, !!checked)}
                            />
                          </TableCell>
                          <TableCell>{submission.studentName}</TableCell>
                          <TableCell>{submission.studentRollNumber || "N/A"}</TableCell>
                          <TableCell>{submission.studentPhone || "N/A"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{submission.score}</span>
                              <span>/ {submission.totalMarks}</span>
                              <span className="text-xs text-gray-500">
                                ({Math.round((submission.score / submission.totalMarks) * 100)}%)
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={submission.released}
                                onCheckedChange={(checked) => handleReleaseResults(submission.id, checked)}
                              />
                              <span className="text-sm">
                                {submission.released ? "Released" : "Hidden"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button onClick={() => handleViewSubmission(submission)} variant="outline">
                              View
                            </Button>
                            <Button 
                              onClick={() => handleAddFeedback(submission)} 
                              variant="outline"
                            >
                              Add Feedback
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {submissions.length === 0 && selectedExamId && (
                <Card>
                  <CardHeader>
                    <CardTitle>No Submissions</CardTitle>
                    <CardDescription>
                      There are no submissions for this exam yet.
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}

        <AlertDialog open={bulkActionDialogOpen} onOpenChange={setBulkActionDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Bulk Release Management</AlertDialogTitle>
              <AlertDialogDescription>
                You've selected {selectedSubmissionIds.length} submissions. Choose whether to release or hide these results from students.
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="flex items-center justify-center gap-4 py-4">
              <div className="flex items-center gap-2 border p-4 rounded-md">
                <Checkbox 
                  id="release-results" 
                  checked={bulkReleaseValue} 
                  onCheckedChange={(checked) => setBulkReleaseValue(!!checked)}
                />
                <Label htmlFor="release-results">
                  {bulkReleaseValue ? "Release results to students" : "Hide results from students"}
                </Label>
              </div>
            </div>
            
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleBulkReleaseAction} disabled={loading}>
                {loading ? "Processing..." : bulkReleaseValue ? "Release Selected" : "Hide Selected"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {selectedSubmission && !showFeedbackForm && (
          <StudentExamDetails
            submission={selectedSubmission}
            questions={questions.filter(q => selectedSubmission.answers.some(a => a.questionId === q.id))}
            open={!!selectedSubmission}
            onClose={() => setSelectedSubmission(null)}
          />
        )}

        {selectedSubmission && showFeedbackForm && (
          <FeedbackForm
            initialValue={selectedSubmission.feedback || ""}
            onSubmit={handleSubmitFeedback}
            onCancel={() => setShowFeedbackForm(false)}
          />
        )}
      </main>
    </div>
  );
};

export default ManageResults;
