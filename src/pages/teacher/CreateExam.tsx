import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2 } from "lucide-react";
import { Exam, Question } from "@/utils/examTypes";
import { getQuestions, saveExam } from "@/utils/supabaseStorage";
import QuestionFilters from "@/components/question/QuestionFilters";
import { v4 as uuidv4 } from 'uuid';

const CreateExam = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [secretCode, setSecretCode] = useState("");
  const [duration, setDuration] = useState(60);
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (!isAuthenticated || user?.role !== "teacher") {
      navigate("/login");
      return;
    }
    
    // Load questions from Supabase
    const loadQuestions = async () => {
      try {
        const questions = await getQuestions();
        setAvailableQuestions(questions);
        setFilteredQuestions(questions);
      } catch (error) {
        console.error("Error loading questions:", error);
        toast({
          title: "Error",
          description: "Failed to load questions. Please try again.",
          variant: "destructive",
        });
      }
    };
    
    loadQuestions();
  }, [isAuthenticated, user, navigate, toast]);
  
  const handleAddQuestion = (question: Question) => {
    setSelectedQuestions(prev => [...prev, question]);
  };
  
  const handleCreateExam = async () => {
    if (!title || !description || !duration || !secretCode) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedQuestions.length === 0) {
      toast({
        title: "No questions selected",
        description: "Please select at least one question for your exam.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Calculate total marks
      const totalExamMarks = selectedQuestions.reduce((total, q) => total + q.marks, 0);
      
      // Create exam and get question IDs
      const questionIds = selectedQuestions.map(q => q.id);
      
      const examToSave = {
        id: uuidv4(),
        title,
        description,
        secretCode,
        duration: Number(duration),
        totalMarks: totalExamMarks,
        createdBy: user?.id || "unknown",
        questions: questionIds,
        isActive: true,
        createdAt: new Date(),
        leaderboardReleased: false,
      };
      
      // Save to Supabase
      const success = await saveExam(examToSave);
      
      if (success) {
        toast({
          title: "Exam created",
          description: "Your exam has been created successfully.",
        });
        
        // Reset form
        setTitle("");
        setDescription("");
        setSecretCode("");
        setDuration(60);
        setSelectedQuestions([]);
        
        navigate("/teacher/dashboard");
      } else {
        toast({
          title: "Error",
          description: "Failed to create exam. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating exam:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };
  
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  };
  
  const handleSecretCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSecretCode(e.target.value);
  };
  
  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDuration(Number(e.target.value));
  };

  const handleDeleteSelectedQuestion = (questionId: string) => {
    setSelectedQuestions(prev => prev.filter(q => q.id !== questionId));
  };

  const handleFilterChange = (filteredQuestions: Question[]) => {
    setFilteredQuestions(filteredQuestions);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-1 container py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Exam</h1>
            <p className="text-gray-500">Design and configure your exam</p>
          </div>
          <Button onClick={() => navigate("/teacher/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
        
        <Tabs defaultValue="details" className="mt-4">
          <TabsList className="w-full max-w-md mx-auto grid grid-cols-3">
            <TabsTrigger value="details">Exam Details</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="selected">Selected Questions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Exam Information</CardTitle>
                <CardDescription>Enter the details for your exam</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Exam Title"
                    value={title}
                    onChange={handleTitleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Exam Description"
                    value={description}
                    onChange={handleDescriptionChange}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="secret-code">Secret Code</Label>
                    <Input
                      id="secret-code"
                      placeholder="Unique Code for Students"
                      value={secretCode}
                      onChange={handleSecretCodeChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      placeholder="Exam Duration"
                      value={duration}
                      onChange={handleDurationChange}
                    />
                  </div>
                </div>
                <Button onClick={handleCreateExam} className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Exam"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="questions" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Questions</CardTitle>
                <CardDescription>Search and filter questions to add to your exam</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <QuestionFilters 
                  questions={availableQuestions} 
                  onFilterChange={handleFilterChange}
                />
                
                <div className="space-y-4">
                  {filteredQuestions.length > 0 ? (
                    filteredQuestions.map((question) => (
                      <div key={question.id} className="border rounded-lg p-4 flex items-start justify-between bg-white">
                        <div className="flex-1">
                          <div className="flex items-start gap-4">
                            {question.image && (
                              <img 
                                src={question.image} 
                                alt="Question"
                                className="h-20 w-20 object-cover rounded"
                                onError={(e) => {
                                  console.error("Error loading image");
                                  e.currentTarget.src = '/placeholder.svg';
                                }}
                              />
                            )}
                            <div className="flex-1">
                              <p className="font-medium">{question.text}</p>
                              <div className="mt-2 grid grid-cols-2 gap-2">
                                {question.options.map((option) => (
                                  <div key={option.id} className="flex items-center text-sm">
                                    <span className={`inline-block h-2 w-2 rounded-full mr-2 ${
                                      question.correctAnswers.includes(option.id) ? "bg-green-500" : "bg-gray-300"
                                    }`}></span>
                                    {option.text}
                                  </div>
                                ))}
                              </div>
                              <div className="mt-2 flex items-center text-xs text-gray-500 space-x-3">
                              <span>Subject: {question.subject}</span>
                                 
                                 <span>Chapter: {question.chapterName}</span>
                                 <span>CO: {question.coNumber}</span>
                                 <span>Marks: {question.marks}</span>
                                 {question.createdBy && user && question.createdBy === user.id && (
                                   <span>Created by you</span>
                                 )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddQuestion(question)}
                          disabled={selectedQuestions.some(q => q.id === question.id)}
                          className="ml-4"
                        >
                          {selectedQuestions.some(q => q.id === question.id) ? "Added" : "Add"}
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No questions match your filters.</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setFilteredQuestions(availableQuestions)}
                        className="mt-2"
                      >
                        Clear Filters
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="selected" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Selected Questions</CardTitle>
                <CardDescription>
                  {selectedQuestions.length} questions selected (Total Marks: {selectedQuestions.reduce((total, q) => total + q.marks, 0)})
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedQuestions.length > 0 ? (
                  selectedQuestions.map((question) => (
                    <div key={question.id} className="border rounded-lg p-4 flex items-start justify-between bg-white">
                      <div className="flex-1">
                        <p className="font-medium">{question.text}</p>
                        <div className="mt-2 flex items-center text-xs text-gray-500 space-x-3">
                          <span>Marks: {question.marks}</span>
                          <span>Chapter: {question.chapterName}</span>
                          <span>CO: {question.coNumber}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSelectedQuestion(question.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No questions selected yet</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => document.getElementById("questions-tab")?.click()}
                      className="mt-2"
                    >
                      Go to Questions
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default CreateExam;
