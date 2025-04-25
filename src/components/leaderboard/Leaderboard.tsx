
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getExams, getExamResults, getLeaderboard, toggleLeaderboard } from "@/utils/supabaseStorage";
import { useAuth } from "@/context/AuthContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertCircle, Award, TrendingUp, Star, StarHalf, StarOff } from "lucide-react";
import { Exam, StudentExamSubmission } from "@/utils/examTypes";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface LeaderboardProps {
  examId: string;
}

const Leaderboard = ({ examId }: LeaderboardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [leaderboardEnabled, setLeaderboardEnabled] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<StudentExamSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Get exam info to check if leaderboard is released
        const examsData = await getExams();
        setExams(examsData);
        
        const currentExam = examsData.find(exam => exam.id === examId);
        
        if (currentExam) {
          setLeaderboardEnabled(currentExam.leaderboardReleased || false);
        }
        
        // Load results for this exam
        const resultsData = await getExamResults();
        setResults(resultsData);
        
        // Load leaderboard data from Supabase
        const data = await getLeaderboard(examId);
        setLeaderboardData(data);
        
        // Check if user is a teacher
        setIsTeacher(user?.role === 'teacher' || user?.role === 'admin');
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading leaderboard data:", error);
        setLoading(false);
      }
    };
    
    if (examId) {
      loadData();
    }
  }, [examId, user?.role]);
  
  // Toggle leaderboard visibility
  const handleToggleLeaderboard = async () => {
    try {
      const newState = !leaderboardEnabled;
      const success = await toggleLeaderboard(examId, newState);
      
      if (success) {
        setLeaderboardEnabled(newState);
        toast({
          title: newState ? "Leaderboard enabled" : "Leaderboard disabled",
          description: newState 
            ? "Students can now see the leaderboard" 
            : "Leaderboard is now hidden from students",
        });
      }
    } catch (error) {
      console.error("Error toggling leaderboard:", error);
      toast({
        title: "Error",
        description: "Failed to update leaderboard settings",
        variant: "destructive",
      });
    }
  };
  
  // Get student names for leaderboard
  const getStudentResults = () => {
    if (!results) return [];
    
    // Filter results for this exam
    const examResults = results.filter(result => result.examId === examId);
    
    // Sort by score percentage
    return examResults
      .sort((a, b) => (b.score/b.totalMarks) - (a.score/a.totalMarks))
      .map((result, index) => ({
        position: index + 1,
        studentName: result.studentName,
        score: result.score,
        totalMarks: result.totalMarks,
        percentage: ((result.score / result.totalMarks) * 100).toFixed(1)
      }));
  };
  
  // Get exam name
  const getExamName = () => {
    if (!exams) return "Exam";
    const exam = exams.find(e => e.id === examId);
    return exam ? exam.title : "Exam";
  };

  // Render stars based on percentage
  const renderStars = (percentage: number) => {
    const maxStars = 5;
    const fullStars = Math.floor(percentage / 20); // 20% per star
    const hasHalfStar = (percentage % 20) >= 10; // Half star if remainder is at least 10%
    const emptyStars = maxStars - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <div className="flex">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
        ))}
        {hasHalfStar && <StarHalf className="h-4 w-4 text-yellow-400 fill-yellow-400" />}
        {[...Array(emptyStars)].map((_, i) => (
          <StarOff key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
        ))}
      </div>
    );
  };
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" /> 
            Loading Leaderboard...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-40">
            <div className="animate-pulse flex flex-col items-center">
              <Award className="h-10 w-10 text-gray-300 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-36 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="overflow-hidden border-t-4 border-t-indigo-500">
      <CardHeader className="space-y-1 bg-gradient-to-r from-indigo-50 to-white dark:from-indigo-950 dark:to-gray-900">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-indigo-500" />
            Leaderboard: {getExamName()}
          </CardTitle>
          
          {isTeacher && (
            <div className="flex items-center space-x-2">
              <Switch 
                id="leaderboard-toggle"
                checked={leaderboardEnabled}
                onCheckedChange={handleToggleLeaderboard}
              />
              <Label htmlFor="leaderboard-toggle">
                {leaderboardEnabled ? "Visible to Students" : "Hidden from Students"}
              </Label>
            </div>
          )}
        </div>
        
        <CardDescription>
          Top performing students ranked by percentage score
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-0">
        {(!leaderboardEnabled && !isTeacher) ? (
          <div className="flex items-center justify-center p-6 text-center">
            <div className="flex flex-col items-center space-y-2">
              <AlertCircle className="w-10 h-10 text-gray-300" />
              <p className="text-gray-500">Leaderboard not available yet</p>
            </div>
          </div>
        ) : getStudentResults().length === 0 ? (
          <div className="flex items-center justify-center p-6 text-center">
            <div className="flex flex-col items-center space-y-2">
              <AlertCircle className="w-10 h-10 text-gray-300" />
              <p className="text-gray-500">No submissions yet</p>
            </div>
          </div>
        ) : (
          <div className="divide-y">
            {getStudentResults().map((student, index) => (
              <div 
                key={index}
                className={`flex items-center p-4 ${
                  index === 0 ? 'bg-gradient-to-r from-yellow-50 to-white dark:from-yellow-900/20 dark:to-transparent' : 
                  index === 1 ? 'bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-transparent' : 
                  index === 2 ? 'bg-gradient-to-r from-amber-50 to-white dark:from-amber-900/20 dark:to-transparent' : 
                  ''
                }`}
              >
                <div className={`font-bold text-center h-8 w-8 rounded-full flex items-center justify-center 
                  ${index === 0 ? 'bg-yellow-400 text-white' : 
                    index === 1 ? 'bg-gray-300 text-gray-800' : 
                    index === 2 ? 'bg-amber-700 text-white' : 
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                  {student.position}
                </div>
                
                <Avatar className="h-10 w-10 mx-3">
                  <AvatarFallback className={`
                    ${index === 0 ? 'bg-yellow-400 text-white' : 
                      index === 1 ? 'bg-gray-300 text-gray-800' : 
                      index === 2 ? 'bg-amber-700 text-white' : 
                      'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100'
                    }`}>
                    {student.studentName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="font-medium">{student.studentName}</div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    {renderStars(parseFloat(student.percentage))}
                    <span>{student.score}/{student.totalMarks}</span>
                  </div>
                </div>
                
                <Badge className={`ml-2 ${
                  parseFloat(student.percentage) >= 90 ? 'bg-green-500 hover:bg-green-600' :
                  parseFloat(student.percentage) >= 75 ? 'bg-blue-500 hover:bg-blue-600' :
                  parseFloat(student.percentage) >= 60 ? 'bg-yellow-500 hover:bg-yellow-600' :
                  'bg-gray-500 hover:bg-gray-600'
                }`}>
                  {student.percentage}%
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Leaderboard;
