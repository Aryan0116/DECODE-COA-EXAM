import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Exam, Question, StudentExamAnswer, StudentExamSubmission } from "@/utils/examTypes";
import { ArrowLeft, ArrowRight, Clock, AlertCircle, Maximize, Minimize } from "lucide-react";
import { getExams, getExamResults, saveExamResult } from "@/utils/supabaseStorage";
import { v4 as uuidv4 } from 'uuid';

const TakeExam = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const isSubmittingRef = useRef(false);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const [exam, setExam] = useState<Exam | null>(
    location.state?.exam || null
  );
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string[]>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [examStarted, setExamStarted] = useState<boolean>(false);
  const [examCompleted, setExamCompleted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [studentRollNumber, setStudentRollNumber] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [showStudentForm, setShowStudentForm] = useState(true);
  const [tabSwitchWarnings, setTabSwitchWarnings] = useState(0);
  const [warningShown, setWarningShown] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Track events separately to prevent double counting
  const visibilityEventRef = useRef(false);
  const blurEventRef = useRef(false);
  
  useEffect(() => {
    const loadExam = async () => {
      if (!examId) {
        setLoadError("No exam ID provided");
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setLoadError(null);
        console.log(`Loading exam with ID: ${examId}`);
        
        const storedExams = await getExams();
        console.log(`Retrieved ${storedExams.length} exams from storage`);
        
        const foundExam = storedExams.find(e => e.id === examId);
        console.log(`Found exam: ${foundExam ? 'Yes' : 'No'}`);
        
        if (foundExam) {
          console.log(`Exam title: ${foundExam.title}`);
          console.log(`Exam has ${foundExam.questions.length} questions`);
          
          if (foundExam.questions.length === 0 && retryCountRef.current < maxRetries) {
            console.log(`Exam has no questions, retrying... (attempt ${retryCountRef.current + 1})`);
            retryCountRef.current += 1;
            
            setTimeout(() => loadExam(), 1500); 
            return;
          }
          
          setExam(foundExam);
          setTimeRemaining(foundExam.duration * 60); // Convert to seconds
        } else {
          console.error(`Exam with ID ${examId} not found`);
          setLoadError("Exam not found");
          toast({
            title: "Exam not found",
            description: "The requested exam couldn't be found.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error loading exam:", error);
        setLoadError("Failed to load exam");
        toast({
          title: "Error loading exam",
          description: "There was a problem loading the exam. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadExam();
  }, [examId, toast]);
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    } else if (user?.role !== "student") {
      navigate("/");
      toast({
        title: "Access denied",
        description: "Only students can take exams.",
        variant: "destructive",
      });
    }
  }, [isAuthenticated, user, navigate, toast]);
  
  useEffect(() => {
    if (!examStarted || examCompleted || !examId) return;
    
    try {
      localStorage.setItem(`exam_${examId}_answers`, JSON.stringify(userAnswers));
      console.log("Saved answers to temporary storage", userAnswers);
    } catch (error) {
      console.error("Error saving answers to temporary storage:", error);
    }
  }, [userAnswers, examId, examStarted, examCompleted]);
  
  useEffect(() => {
    if (!examStarted || !examId) return;
    
    try {
      const savedAnswers = localStorage.getItem(`exam_${examId}_answers`);
      if (savedAnswers) {
        const parsedAnswers = JSON.parse(savedAnswers);
        console.log("Loaded answers from temporary storage", parsedAnswers);
        setUserAnswers(parsedAnswers);
      }
    } catch (error) {
      console.error("Error loading answers from temporary storage:", error);
    }
  }, [examId, examStarted]);
  
  useEffect(() => {
    if (!examStarted || examCompleted) return;
    
    let isCancelled = false;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1 && !isCancelled) {
          clearInterval(timer);
          isCancelled = true; // Prevent multiple calls
          
          console.log("Time's up - attempting auto-submit");
          if (!isSubmittingRef.current) {
            isSubmittingRef.current = true;
            handleSubmitExam(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      isCancelled = true;
      clearInterval(timer);
    };
  }, [examStarted, examCompleted]);
  
  useEffect(() => {
    if (!examStarted || examCompleted) return;
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      return e.returnValue = "Are you sure you want to leave? Your exam may be auto-submitted.";
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [examStarted, examCompleted]);
  
  // Handle visibility changes (tab switches)
  useEffect(() => {
    if (!examStarted || examCompleted) return;
  
    const handleVisibilityChange = () => {
      if (document.hidden && !isSubmittingRef.current) {
        // Prevent double counting
        if (blurEventRef.current) {
          blurEventRef.current = false;
          return;
        }
        
        visibilityEventRef.current = true;
        
        // Page is hidden (user switched tabs)
        const newWarningCount = tabSwitchWarnings + 1;
        setTabSwitchWarnings(newWarningCount);
        
        if (newWarningCount >= 3) {
          // Third switch - auto submit
          console.log("Third violation detected - auto-submitting exam");
          toast({
            title: "Exam auto-submitted",
            description: "Your exam has been submitted due to multiple tab switching violations.",
            variant: "destructive",
          });
          handleSubmitExam(true);
        } else {
          // First or second warning
          setWarningShown(true);
          toast({
            title: `Warning ${newWarningCount}/3`,
            description: `Changing tabs or windows is not allowed. Your exam will be submitted automatically after 3 violations.`,
            variant: "destructive",
          });
        }
        
        // Reset after a short delay
        setTimeout(() => {
          visibilityEventRef.current = false;
        }, 100);
      }
    };
  
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [examStarted, examCompleted, tabSwitchWarnings]);

  // Handle window blur/focus
  useEffect(() => {
    if (!examStarted || examCompleted) return;
  
    const handleWindowBlur = () => {
      if (!isSubmittingRef.current) {
        // Prevent double counting
        if (visibilityEventRef.current) {
          return;
        }
        
        blurEventRef.current = true;
        
        // Only increment warning if this is a genuine window blur
        const newWarningCount = tabSwitchWarnings + 1;
        setTabSwitchWarnings(newWarningCount);
        
        if (newWarningCount >= 3) {
          // Third violation - auto submit
          console.log("Third violation detected - auto-submitting exam");
          toast({
            title: "Exam auto-submitted",
            description: "Your exam has been submitted due to multiple window focus violations.",
            variant: "destructive",
          });
          handleSubmitExam(true);
        } else {
          // First or second warning
          setWarningShown(true);
          toast({
            title: `Warning ${newWarningCount}/3`,
            description: `Changing windows is not allowed. Your exam will be submitted automatically after 3 violations.`,
            variant: "destructive",
          });
        }
        
        // Reset after a short delay
        setTimeout(() => {
          blurEventRef.current = false;
        }, 100);
      }
    };
  
    window.addEventListener('blur', handleWindowBlur);
    
    return () => {
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [examStarted, examCompleted, tabSwitchWarnings]);

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      // Update fullscreen state
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Enter fullscreen when exam starts
  useEffect(() => {
    if (examStarted && !examCompleted) {
      enterFullscreen();
    } else if (examCompleted) {
      exitFullscreen();
    }
  }, [examStarted, examCompleted]);

  const enterFullscreen = () => {
    try {
      const docElement = document.documentElement;
      if (docElement.requestFullscreen) {
        docElement.requestFullscreen();
      }
    } catch (error) {
      console.error("Error entering fullscreen:", error);
      toast({
        title: "Fullscreen Warning",
        description: "Unable to enter fullscreen mode. For the best exam experience, please use fullscreen.",
        variant: "destructive",
      });
    }
  };

  const exitFullscreen = () => {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen();
      }
    } catch (error) {
      console.error("Error exiting fullscreen:", error);
    }
  };

  const toggleFullscreen = () => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  };
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const handleStartExam = () => {
    if (!studentRollNumber || !studentPhone) {
      toast({
        title: "Required Information",
        description: "Please provide both roll number and phone number to start the exam.",
        variant: "destructive",
      });
      return;
    }

    setExamStarted(true);
    setShowStudentForm(false);

    setTimeout(() => {
      toast({
        title: "Exam started",
        description: `You have ${exam?.duration} minutes to complete this exam.`,
      });
    }, 0);
  };

  const handleOptionSelect = (questionId: string, optionId: string) => {
    setUserAnswers(prev => {
      const currentAnswers = prev[questionId] || [];
      const currentQuestion = exam?.questions.find(q => q.id === questionId);
      let newAnswers;
      
      if (currentQuestion?.correctAnswers.length === 1) {
        newAnswers = { ...prev, [questionId]: [optionId] };
      } else {
        if (currentAnswers.includes(optionId)) {
          newAnswers = { ...prev, [questionId]: currentAnswers.filter(id => id !== optionId) };
        } else {
          newAnswers = { ...prev, [questionId]: [...currentAnswers, optionId] };
        }
      }
      
      try {
        localStorage.setItem(`exam_${examId}_answers`, JSON.stringify(newAnswers));
      } catch (error) {
        console.error("Error saving to temporary storage:", error);
      }
      
      return newAnswers;
    });
  };
  
  const handleNextQuestion = () => {
    if (exam && currentQuestionIndex < exam.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };
  
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };
  
  const handleSubmitExam = async (isAutoSubmit = false) => {
    console.log(`Submit exam called (auto-submit: ${isAutoSubmit})`);
    
    if (isSubmittingRef.current && !isAutoSubmit) {
      console.log("Already submitting, ignoring duplicate submission");
      return;
    }
    
    isSubmittingRef.current = true;
    
    if (!exam || !user) {
      console.error("Missing exam or user data for submission");
      isSubmittingRef.current = false;
      return;
    }
    
    try {
      console.log("Setting submitting state");
      setExamCompleted(true);
      
      let answersToSubmit = userAnswers;
      try {
        const savedAnswers = localStorage.getItem(`exam_${exam.id}_answers`);
        if (savedAnswers) {
          const parsedAnswers = JSON.parse(savedAnswers);
          console.log("Using answers from temporary storage for submission", parsedAnswers);
          answersToSubmit = parsedAnswers;
        }
      } catch (error) {
        console.error("Error reading from temporary storage, using state instead:", error);
      }
      
      let totalScore = 0;
      const answers: StudentExamAnswer[] = [];
      
      exam.questions.forEach(question => {
        const userAnswer = answersToSubmit[question.id] || [];
        
        answers.push({
          questionId: question.id,
          selectedOptions: userAnswer,
        });
        
        if (userAnswer.length > 0) {
          const correctAnswers = new Set(question.correctAnswers);
          const userAnswerSet = new Set(userAnswer);
          
          if (correctAnswers.size === userAnswerSet.size) {
            let allCorrect = true;
            
            userAnswer.forEach(option => {
              if (!correctAnswers.has(option)) {
                allCorrect = false;
              }
            });
            
            if (allCorrect) {
              totalScore += question.marks;
            }
          }
        }
      });
      
      console.log(`Prepared ${answers.length} answers for submission`);
      
      const submission: StudentExamSubmission = {
        id: uuidv4(),
        studentId: user.id,
        studentName: user.name || "Student",
        studentRollNumber: studentRollNumber,
        studentPhone: studentPhone,
        examId: exam.id,
        examTitle: exam.title,
        answers: answers,
        startTime: new Date(Date.now() - ((exam.duration * 60) - timeRemaining) * 1000),
        endTime: new Date(),
        score: totalScore,
        totalMarks: exam.totalMarks,
        released: false
      };
      
      console.log("About to save exam result to backend");
      const success = await saveExamResult(submission);
      
      if (!success) {
        throw new Error("Failed to save exam result");
      }
      
      try {
        localStorage.removeItem(`exam_${exam.id}_answers`);
        console.log("Cleared temporary answer storage");
      } catch (error) {
        console.error("Error clearing temporary storage:", error);
      }
      
      console.log("Submission successful, showing toast and navigating");
      
      toast({
        title: isAutoSubmit ? "Time's up! Exam submitted" : "Exam submitted",
        description: "Your exam has been submitted successfully. Results will be available once released by your teacher.",
      });
      
      setTimeout(() => {
        console.log("Redirecting to dashboard");
        navigate("/student/dashboard", { replace: true });
      }, 1500);
      
    } catch (error) {
      console.error("Error submitting exam:", error);
      isSubmittingRef.current = false;
      setExamCompleted(false);
      
      toast({
        title: "Error submitting exam",
        description: "There was a problem submitting your exam. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-blue-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center">Loading Exam...</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }
  
  if (loadError || !exam) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-blue-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center">Exam Not Found</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <AlertCircle className="h-12 w-12 text-red-500" />
              <p className="text-center">
                {loadError || "The requested exam could not be found or has been removed."}
              </p>
              <Button onClick={() => navigate("/student/dashboard")}>
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }
  
  if (!exam.questions || exam.questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-blue-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center">{exam.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <AlertCircle className="h-12 w-12 text-amber-500" />
              <p className="text-center">This exam doesn't have any questions yet or questions failed to load.</p>
              <p className="text-sm text-gray-500 mt-2">Please try refreshing the page or contact your teacher.</p>
              <Button onClick={() => navigate("/student/dashboard")}>
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }
  
  const safeCurrentQuestionIndex = Math.min(currentQuestionIndex, exam.questions.length - 1);
  const currentQuestion = exam.questions[safeCurrentQuestionIndex];
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-blue-50">
      <Header />
      
      <main className="flex-1 container py-8">
        {!examStarted ? (
          <Card className="max-w-2xl mx-auto animate-fade-in">
            <CardHeader>
              <CardTitle>{exam?.title}</CardTitle>
              {showStudentForm && (
                <CardDescription>Please provide your details to start the exam</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Exam Instructions - Always shown at the top */}
              <div className="space-y-2">
                <h3 className="font-medium">Exam Instructions</h3>
                <p className="text-gray-600">{exam.description}</p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 mt-2">
                  <li>This exam contains {exam.questions.length} questions</li>
                  <li>Total marks: {exam.totalMarks}</li>
                  <li>Time limit: {exam.duration} minutes</li>
                  <li>You cannot pause the exam once started</li>
                  <li>The exam will run in fullscreen mode for better focus</li>
                </ul>
              </div>
              
              {/* Warning notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800">Important</h4>
                  <p className="text-sm text-amber-700">
                    Once you start the exam, do not refresh the page, navigate away, or exit fullscreen as it may result in automatic submission after 3 violations.
                  </p>
                </div>
              </div>
              
              {/* Form Instructions */}
              <div className="space-y-2">
                <h3 className="font-medium">Registration</h3>
                <p className="text-gray-600">Please enter your details below to begin the exam.</p>
              </div>
              
              {/* Student Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rollNumber">Roll Number</Label>
                  <Input
                    id="rollNumber"
                    value={studentRollNumber}
                    onChange={(e) => setStudentRollNumber(e.target.value)}
                    placeholder="Enter your roll number"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={studentPhone}
                    onChange={(e) => setStudentPhone(e.target.value)}
                    placeholder="Enter your phone number"
                    required
                  />
                </div>
                <Button onClick={handleStartExam} className="w-full" size="lg">
                  Start Exam
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : examCompleted ? (
          <Card className="max-w-2xl mx-auto animate-fade-in">
            <CardHeader>
              <CardTitle>Exam Completed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <div className="h-24 w-24 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="h-12 w-12"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold">Thank You!</h2>
              <p className="text-gray-600">
                Your exam has been submitted successfully. You will be redirected to your dashboard shortly.
              </p>
              <Button onClick={() => navigate("/student/dashboard")}>
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">{exam.title}</h1>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? (
                    <>
                      <Minimize className="h-4 w-4" />
                      Exit Fullscreen
                    </>
                  ) : (
                    <>
                      <Maximize className="h-4 w-4" />
                      Enter Fullscreen
                    </>
                  )}
                </Button>
                <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="font-mono font-medium text-blue-700">
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span>Question {safeCurrentQuestionIndex + 1} of {exam.questions.length}</span>
              <span>{currentQuestion.marks} marks</span>
            </div>
            
            <Card className="animate-fade-in">
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {currentQuestion.correctAnswers.length > 1 && (
                    <div className="mb-2">
                      <span className="inline-block bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1 rounded-md border border-blue-200">
                        MSQ - Select Multiple Answers
                      </span>
                    </div>
                  )}
                  <h2 className="text-lg font-medium mb-2">
                    {currentQuestion.text}
                  </h2>
                  {currentQuestion.image && (
                    <div className="my-4 max-w-md mx-auto">
                      <img
                        src={currentQuestion.image}
                        alt="Question illustration"
                        className="rounded-lg border"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = '/placeholder.svg';
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    {currentQuestion.options.map((option) => {
                      const isSelected = (userAnswers[currentQuestion.id] || []).includes(option.id);
                      return (
                        <div
                          key={option.id}
                          className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-blue-50 border-blue-200"
                              : "hover:bg-gray-50"
                          }`}
                          onClick={() => handleOptionSelect(currentQuestion.id, option.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-5 w-5 rounded-full flex items-center justify-center border ${
                                isSelected
                                  ? "bg-blue-500 border-blue-500"
                                  : "border-gray-300"
                              }`}
                            >
                              {isSelected && (
                                <div className="h-2 w-2 rounded-full bg-white"></div>
                              )}
                            </div>
                            <span>{option.text}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={handlePreviousQuestion}
                disabled={safeCurrentQuestionIndex === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              {safeCurrentQuestionIndex === exam.questions.length - 1 ? (
                <Button onClick={() => handleSubmitExam(false)}>
                  Submit Exam
                </Button>
              ) : (
                <Button onClick={handleNextQuestion}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 justify-center mt-6">
              {exam.questions.map((_, index) => {
                const questionId = exam.questions[index].id;
                const isAnswered = userAnswers[questionId]?.length > 0;
                const isCurrent = index === safeCurrentQuestionIndex;
                
                return (
                  <button
                    key={index}
                    className={`h-8 w-8 rounded-full text-sm font-medium flex items-center justify-center ${
                      isCurrent
                        ? "bg-blue-500 text-white"
                        : isAnswered
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : "bg-gray-100 text-gray-700 border border-gray-200"
                    }`}
                    onClick={() => setCurrentQuestionIndex(index)}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </main>
      {warningShown && examStarted && !examCompleted && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-bold text-red-600">Warning {tabSwitchWarnings}/3</h3>
            <p className="my-4">
              Changing tabs, exiting fullscreen or navigating away from this page is not allowed during the exam.
              {tabSwitchWarnings >= 2 ? (
                <strong> Your exam will be automatically submitted on the next violation.</strong>
              ) : (
                ` You have ${3 - tabSwitchWarnings} warnings remaining before auto-submission.`
              )}
            </p>
            <Button 
              onClick={() => setWarningShown(false)} 
              className="w-full"
            >
              I Understand
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TakeExam;