import { useState, useEffect, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { downloadQuestionCsvTemplate } from '@/utils/helpers';
import Papa from 'papaparse';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Upload, 
  Plus, 
  Trash2, 
  FileUp, 
  AlertTriangle
} from "lucide-react";
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
import { mockQuestions, Question, Option } from "@/utils/examTypes";
import { getQuestions, saveQuestion, deleteQuestion, saveQuestions } from "@/utils/supabaseStorage";
import QuestionFilters from "@/components/question/QuestionFilters";
import { v4 as uuidv4 } from 'uuid';

const AddQuestion = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State for manual question creation
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState<Option[]>([
    { id: "o1", text: "" },
    { id: "o2", text: "" },
    { id: "o3", text: "" },
    { id: "o4", text: "" },
  ]);
  const [correctAnswers, setCorrectAnswers] = useState<string[]>([]);
  const [marks, setMarks] = useState(1);
  const [chapterName, setChapterName] = useState("");
  const [coNumber, setCoNumber] = useState("");
  const [subjectType, setSubjectType] = useState<"CO" | "CA">("CO");
  const [subjectNumber, setSubjectNumber] = useState<string>("1");
  const [image, setImage] = useState<string | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploadedQuestions, setUploadedQuestions] = useState<Question[]>([]);
  
  // State for list of questions
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
  
  useEffect(() => {
    if (!isAuthenticated || user?.role !== "teacher") {
      navigate("/login");
      return;
    }
    
    // Load questions from Supabase
    const loadQuestions = async () => {
      try {
        setLoading(true);
        const storedQuestions = await getQuestions();
        const loadedQuestions = storedQuestions.length > 0 ? storedQuestions : mockQuestions;
        setQuestions(loadedQuestions);
        setFilteredQuestions(loadedQuestions);
      } catch (error) {
        console.error("Error loading questions:", error);
        toast({
          title: "Error loading questions",
          description: "There was a problem loading your questions. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadQuestions();
  }, [isAuthenticated, user, navigate, toast]);

  // Update CO number when subject type or number changes
  useEffect(() => {
    setCoNumber(`${subjectType}${subjectNumber}`);
  }, [subjectType, subjectNumber]);

  const handleAddOption = () => {
    const newId = `o${options.length + 1}`;
    setOptions([...options, { id: newId, text: "" }]);
  };

  const handleRemoveOption = (id: string) => {
    if (options.length <= 2) {
      toast({
        title: "Cannot remove option",
        description: "A question must have at least 2 options.",
        variant: "destructive",
      });
      return;
    }
    setOptions(options.filter(option => option.id !== id));
    setCorrectAnswers(correctAnswers.filter(answerId => answerId !== id));
  };

  const handleOptionTextChange = (id: string, text: string) => {
    setOptions(options.map(option => 
      option.id === id ? { ...option, text } : option
    ));
  };

  const handleCorrectAnswerToggle = (id: string) => {
    setCorrectAnswers(prev => 
      prev.includes(id)
        ? prev.filter(answerId => answerId !== id)
        : [...prev, id]
    );
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImage(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  // const handleCsvUpload = (e: ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (file) {
  //     setCsvFile(file);
      
  //     // In a real app, you would parse the CSV file
  //     // For now, we'll just pretend it was successful
  //     toast({
  //       title: "CSV file selected",
  //       description: "Ready to import questions from CSV.",
  //     });
  //   }
  // };

  // const importQuestionsFromCsv = () => {
  //   if (!csvFile) {
  //     toast({
  //       title: "No file selected",
  //       description: "Please select a CSV file first.",
  //       variant: "destructive",
  //     });
  //     return;
  //   }
    
  //   // Mock CSV import - in a real app, you would parse the CSV and create questions
  //   const mockImportedQuestions: Question[] = [
  //     {
  //       id: `q${Date.now()}-1`,
  //       text: "What is the capital of France?",
  //       options: [
  //         { id: "o1", text: "London" },
  //         { id: "o2", text: "Paris" },
  //         { id: "o3", text: "Berlin" },
  //         { id: "o4", text: "Madrid" }
  //       ],
  //       correctAnswers: ["o2"],
  //       marks: 2,
  //       chapterName: "Geography",
  //       coNumber: "CO1",
  //     },
  //     {
  //       id: `q${Date.now()}-2`,
  //       text: "Which of the following are primary colors?",
  //       options: [
  //         { id: "o1", text: "Red" },
  //         { id: "o2", text: "Green" },
  //         { id: "o3", text: "Blue" },
  //         { id: "o4", text: "Orange" }
  //       ],
  //       correctAnswers: ["o1", "o3"],
  //       marks: 3,
  //       chapterName: "Art",
  //       coNumber: "CO2",
  //     },
  //   ];
    
  //   setUploadedQuestions(mockImportedQuestions);
    
  //   toast({
  //     title: "Import successful",
  //     description: `Imported ${mockImportedQuestions.length} questions.`,
  //   });
  // };

  const confirmImportQuestions = async () => {
    try {
      // Save all uploaded questions
      await saveQuestions(uploadedQuestions);
      
      // Update local state
      const updatedQuestions = [...questions, ...uploadedQuestions];
      setQuestions(updatedQuestions);
      setFilteredQuestions(updatedQuestions);
      setUploadedQuestions([]);
      setCsvFile(null);
      
      toast({
        title: "Questions added",
        description: `Added ${uploadedQuestions.length} questions to your collection.`,
      });
    } catch (error) {
      console.error("Error saving imported questions:", error);
      toast({
        title: "Error saving questions",
        description: "There was a problem saving the imported questions.",
        variant: "destructive",
      });
    }
  };
  const parseQuestionCsv = (csvData) => {
    try {
      // Define the expected CSV headers
      const expectedHeaders = [
        'questionText', 'option1', 'option2', 'option3', 'option4', 'correctAnswers', 'marks', 'chapterName', 'coNumber'
      ];
      
      // Validate CSV structure
      const headers = Object.keys(csvData[0]);
      const missingHeaders = expectedHeaders.filter(header => !headers.includes(header));
      
      if (missingHeaders.length > 0) {
        throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
      }
      
      // Transform the CSV data into Question objects
      return csvData.map((row, index) => {
        // Create option objects
        const options = [
          { id: 'o1', text: row.option1 },
          { id: 'o2', text: row.option2 },
          { id: 'o3', text: row.option3 },
          { id: 'o4', text: row.option4 },
        ];
        
        // Additional options if they exist
        for (let i = 5; i <= 10; i++) {
          if (row[`option${i}`]) {
            options.push({ id: `o${i}`, text: row[`option${i}`] });
          }
        }
        
        // Parse correct answers
        // Format should be comma-separated option IDs like "o1,o3" or numeric like "1,3"
        let correctAnswers = [];
        if (row.correctAnswers) {
          // Try to parse as option IDs first
          if (row.correctAnswers.toLowerCase().includes('o')) {
            correctAnswers = row.correctAnswers.split(',').map(a => a.trim());
          } else {
            // Parse as numeric indices
            correctAnswers = row.correctAnswers.split(',')
              .map(a => a.trim())
              .map(a => `o${a}`);
          }
        }
        
        return {
          id: uuidv4(),
          text: row.questionText,
          options,
          correctAnswers,
          marks: parseInt(row.marks) || 1,
          chapterName: row.chapterName,
          coNumber: row.coNumber,
          createdBy: user?.id,
          // No image support in CSV import
        };
      });
    } catch (error) {
      console.error("Error parsing CSV:", error);
      throw error;
    }
  };
  
  // Replace your handleCsvUpload function with this:
  const handleCsvUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
      
      // Reset any previously uploaded questions
      setUploadedQuestions([]);
      
      toast({
        title: "CSV file selected",
        description: "Click 'Import Questions' to preview questions from CSV.",
      });
    }
  };
  
  // Replace your importQuestionsFromCsv function with this:
  const importQuestionsFromCsv = () => {
    if (!csvFile) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file first.",
        variant: "destructive",
      });
      return;
    }
    
    // Show loading toast
    toast({
      title: "Processing CSV",
      description: "Parsing and validating your questions...",
    });
    
    // Parse the CSV file
    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          if (results.errors.length > 0) {
            throw new Error(`CSV parsing error: ${results.errors[0].message}`);
          }
          
          if (results.data.length === 0) {
            throw new Error("No data found in CSV file");
          }
          
          // Parse the CSV data into Question objects
          const parsedQuestions = parseQuestionCsv(results.data);
          setUploadedQuestions(parsedQuestions);
          
          toast({
            title: "Import successful",
            description: `Imported ${parsedQuestions.length} questions. Review and click 'Add to Question Bank' to save.`,
          });
        } catch (error) {
          console.error("Error importing questions:", error);
          toast({
            title: "Import failed",
            description: error.message || "Failed to import questions from CSV",
            variant: "destructive",
          });
        }
      },
      error: (error) => {
        console.error("Papa Parse error:", error);
        toast({
          title: "Import failed",
          description: "Failed to parse CSV file",
          variant: "destructive",
        });
      }
    });
  };
  const handleCreateQuestion = async () => {
    if (!questionText) {
      toast({
        title: "Question text required",
        description: "Please enter a question.",
        variant: "destructive",
      });
      return;
    }
    
    if (options.some(option => !option.text)) {
      toast({
        title: "Empty options",
        description: "All options must have text.",
        variant: "destructive",
      });
      return;
    }
    
    if (correctAnswers.length === 0) {
      toast({
        title: "No correct answer",
        description: "Please select at least one correct answer.",
        variant: "destructive",
      });
      return;
    }
    
    if (!chapterName || !coNumber) {
      toast({
        title: "Missing information",
        description: "Chapter name and CO number are required.",
        variant: "destructive",
      });
      return;
    }
    
    const newQuestion: Question = {
      id: uuidv4(), // Use UUID v4 to generate a proper UUID
      text: questionText,
      options: [...options],
      correctAnswers: [...correctAnswers],
      marks,
      chapterName,
      coNumber,
      createdBy: user?.id,
      ...(image && { image }),
    };
    
    try {
      setLoading(true);
      // Save the question to Supabase
      const success = await saveQuestion(newQuestion);
      
      if (success) {
        // Update local state
        const updatedQuestions = [...questions, newQuestion];
        setQuestions(updatedQuestions);
        setFilteredQuestions(updatedQuestions);
        
        // Reset form
        setQuestionText("");
        setOptions([
          { id: "o1", text: "" },
          { id: "o2", text: "" },
          { id: "o3", text: "" },
          { id: "o4", text: "" },
        ]);
        setCorrectAnswers([]);
        setMarks(1);
        setChapterName("");
        // Don't reset subject type and number to maintain user's preference
        setImage(null);
        
        toast({
          title: "Question created",
          description: "New question added to your collection.",
        });
      } else {
        throw new Error("Failed to save question");
      }
    } catch (error) {
      console.error("Error creating question:", error);
      toast({
        title: "Error creating question",
        description: "There was a problem saving your question. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filtered: Question[]) => {
    setFilteredQuestions(filtered);
  };

  const handleDeleteQuestion = (questionId: string) => {
    setQuestionToDelete(questionId);
  };
  const chapterNames = {
    "CO": {
      "1": "Introduction to Computer Organisation",
      "2": "Data Representation",
      "3": "Digital Logic Circuits",
      "4": "Central Processing Unit",
      "5": "Memory Organisation",
      "6": "Input/Output Organisation",
    },
    "CA": {
      "1": "Fundamentals of Computer Architecture",
      "2": "Instruction Set Architecture",
      "3": "Pipelining",
      "4": "Memory Hierarchy Design",
      "5": "Input/Output Systems",
      "6": "Parallel Processing",
    },
  };
  const confirmDeleteQuestion = async () => {
    if (questionToDelete) {
      try {
        const success = await deleteQuestion(questionToDelete);
        
        if (success) {
          // Update local state
          setQuestions(prev => prev.filter(q => q.id !== questionToDelete));
          setFilteredQuestions(prev => prev.filter(q => q.id !== questionToDelete));
          setQuestionToDelete(null);
          
          toast({
            title: "Question deleted",
            description: "The question has been removed from your question bank.",
          });
        } else {
          throw new Error("Failed to delete question");
        }
      } catch (error) {
        console.error("Error deleting question:", error);
        toast({
          title: "Error deleting question",
          description: "There was a problem deleting the question. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-1 container py-8">
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Question Bank</h1>
              <p className="text-gray-500">Manage and create questions for your exams</p>
            </div>
            <Button onClick={() => navigate("/teacher/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
          
          <Tabs defaultValue="create">
            <TabsList className="w-full max-w-md mx-auto grid grid-cols-3">
              <TabsTrigger value="create">Create Question</TabsTrigger>
              <TabsTrigger value="import">Import CSV</TabsTrigger>
              <TabsTrigger value="questions">Question Bank</TabsTrigger>
            </TabsList>
            
            <TabsContent value="create" className="mt-6">
              <Card className="glass-morphism animate-fade-in">
                <CardHeader>
                  <CardTitle>Create New Question</CardTitle>
                  <CardDescription>
                    Add a new question to your question bank
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="question-text">Question</Label>
                    <Textarea
                      id="question-text"
                      placeholder="Enter your question here"
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      className="min-h-24"
                    />
                  </div>
                  
                  <Label>If more then one correct Select Multiple (MSQ)</Label>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                    
                      <Label>Options</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddOption}
                        className="flex items-center gap-1"
                      >
                        <Plus className="h-4 w-4" />
                        Add Option
                      </Button>
                    </div>
                    
                    {options.map((option) => (
                      <div key={option.id} className="flex items-start gap-2">
                        <Checkbox
                          id={`option-${option.id}`}
                          checked={correctAnswers.includes(option.id)}
                          onCheckedChange={() => handleCorrectAnswerToggle(option.id)}
                        />
                        <div className="flex-1">
                          <Input
                            placeholder={`Option ${option.id.replace('o', '')}`}
                            value={option.text}
                            onChange={(e) => handleOptionTextChange(option.id, e.target.value)}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveOption(option.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <p className="text-xs text-gray-500">
                      Check the box for correct answer(s)
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="subject-type">Subject Name</Label>
                      <Select 
                        value={subjectType} 
                        onValueChange={(value) => setSubjectType(value as "CO" | "CA")}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CO">COMPUTER ORGANISATION (CO)</SelectItem>
                          <SelectItem value="CA">COMPUTER ARCHITECTURE (CA)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
  <Label htmlFor="subject-number">CHAPTER NAME</Label>
  <Select
    value={subjectNumber}
    onValueChange={setSubjectNumber}
  >
    <SelectTrigger>
      <SelectValue placeholder="Select chapter" />
    </SelectTrigger>
    <SelectContent>
      {[1, 2, 3, 4, 5, 6].map(num => (
        <SelectItem key={num} value={num.toString()}>
          {chapterNames[subjectType]?.[num.toString()] || `Chapter ${num}`}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="marks">Marks</Label>
                      <Input
                        id="marks"
                        type="number"
                        min="1"
                        value={marks}
                        onChange={(e) => setMarks(parseInt(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="co-number">CO Number</Label>
                      <Input
                        id="co-number"
                        placeholder="e.g. CO1, CO2"
                        value={coNumber}
                        onChange={(e) => setCoNumber(e.target.value)}
                        readOnly
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="chapter">Topic Name</Label>
                    <Input
                      id="chapter"
                      placeholder="e.g. Name of Topic"
                      value={chapterName}
                      onChange={(e) => setChapterName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Image (Optional)</Label>
                    <div className="flex items-center gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("question-image")?.click()}
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Image
                      </Button>
                      <Input
                        id="question-image"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      {image && (
                        <div className="relative h-16 w-16 rounded overflow-hidden">
                          <img
                            src={image}
                            alt="Question"
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              console.error("Error loading image");
                              e.currentTarget.src = '/placeholder.svg';
                            }}
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-0 right-0 h-6 w-6"
                            onClick={() => setImage(null)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button onClick={handleCreateQuestion} className="w-full">
                    Create Question
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

<TabsContent value="import" className="mt-6">
  <Card className="glass-morphism animate-fade-in">
    <CardHeader>
      <CardTitle>Import Questions from CSV</CardTitle>
      <CardDescription>
        Bulk import questions using a CSV file
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="space-y-4">
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center text-center">
          <FileUp className="h-10 w-10 text-gray-400 mb-2" />
          <h3 className="font-medium">Upload CSV File</h3>
          <p className="text-sm text-gray-500 mb-4">
            The CSV file must include: questionText, options, correctAnswers, marks, chapterName, coNumber
          </p>
          <div className="flex flex-col gap-2 w-full max-w-xs">
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById("csv-file")?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </Button>
            <Button 
  variant="secondary"
  size="sm"
  onClick={downloadQuestionCsvTemplate}
>
  <FileUp className="h-4 w-4 mr-2" />
  Download Template
</Button>
          </div>
          <Input
            id="csv-file"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleCsvUpload}
          />
          {csvFile && (
            <div className="flex items-center gap-2 mt-4 text-sm bg-gray-50 p-2 rounded w-full max-w-xs">
              <FileUp className="h-4 w-4 text-gray-500" />
              <span className="truncate">{csvFile.name}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 ml-auto"
                onClick={() => setCsvFile(null)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
        
        <Button
          onClick={importQuestionsFromCsv}
          disabled={!csvFile}
          className="w-full"
        >
          Preview Questions
        </Button>
      </div>
      
      {uploadedQuestions.length > 0 && (
        <div className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Preview Imported Questions</h3>
            <span className="text-sm text-gray-500">
              {uploadedQuestions.length} questions found
            </span>
          </div>
          
          <div className="max-h-80 overflow-y-auto space-y-4 pr-2">
            {uploadedQuestions.map((question, index) => (
              <div key={index} className="border rounded-lg p-4 bg-white">
                <p className="font-medium">{question.text}</p>
                <div className="mt-2 space-y-1">
                  {question.options.map((option) => (
                    <div key={option.id} className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${
                        question.correctAnswers.includes(option.id)
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}></span>
                      <span className="text-sm">{option.text}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap items-center text-xs text-gray-500 gap-4">
                  <span>Marks: {question.marks}</span>
                  <span>Topic: {question.chapterName}</span>
                  <span>CO: {question.coNumber}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex flex-col gap-2">
            <Button onClick={confirmImportQuestions} className="w-full">
              Add to Question Bank
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setUploadedQuestions([])}
              className="w-full"
            >
              Cancel Import
            </Button>
          </div>
        </div>
      )}
      
      <div className="border-t pt-4 mt-8">
        <h3 className="font-medium mb-2">CSV Format Guidelines</h3>
        <p className="text-sm text-gray-600 mb-4">
          Your CSV file must include the following columns:
        </p>
        <div className="bg-gray-50 p-4 rounded text-sm overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4 font-medium">Column</th>
                <th className="text-left py-2 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 pr-4 font-mono text-xs">questionText</td>
                <td className="py-2">The full question text</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 font-mono text-xs">option1, option2...</td>
                <td className="py-2">Answer options (at least 2 required)</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 font-mono text-xs">correctAnswers</td>
                <td className="py-2">Comma-separated list (e.g., "o1,o3" or "1,3")</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 font-mono text-xs">marks</td>
                <td className="py-2">Point value (integer)</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 font-mono text-xs">chapterName</td>
                <td className="py-2">Topic or chapter name</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono text-xs">coNumber</td>
                <td className="py-2">Course outcome (e.g., "CO1")</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </CardContent>
  </Card>
</TabsContent>
            
            <TabsContent value="questions" className="mt-6">
              <Card className="glass-morphism animate-fade-in">
                <CardHeader>
                  <CardTitle>Question Bank</CardTitle>
                  <CardDescription>
                    All your created questions ({questions.length})
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {questions.length > 0 ? (
                    <div className="space-y-6">
                      <QuestionFilters 
                        questions={questions} 
                        onFilterChange={handleFilterChange} 
                      />
                      
                      {filteredQuestions.length > 0 ? (
                        filteredQuestions.map((question) => (
                          <div key={question.id} className="border rounded-lg p-4 bg-white">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium">{question.text}</p>
                                <div className="mt-2 space-y-1">
                                  {question.options.map((option) => (
                                    <div key={option.id} className="flex items-center gap-2">
                                      <span className={`h-2 w-2 rounded-full ${
                                        question.correctAnswers.includes(option.id)
                                          ? "bg-green-500"
                                          : "bg-gray-300"
                                      }`}></span>
                                      <span className="text-sm">{option.text}</span>
                                    </div>
                                  ))}
                                </div>
                                <div className="mt-2 flex items-center text-xs text-gray-500 gap-4">
                                  <span>Marks: {question.marks}</span>
                                  <span>Topic: {question.chapterName}</span>
                                  <span>CO: {question.coNumber}</span>
                                  {question.createdBy && user && question.createdBy === user.id && (
                                    <span>Created by you</span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-start gap-2">
                                {question.image && (
                                  <div className="h-16 w-16 rounded overflow-hidden">
                                    <img
                                      src={question.image}
                                      alt="Question"
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                )}
                                
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="text-red-500 hover:text-red-700 hover:bg-red-100"
                                  onClick={() => handleDeleteQuestion(question.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500">No questions match the current filters</p>
                          <Button 
                            variant="outline" 
                            className="mt-4"
                            onClick={() => setFilteredQuestions(questions)}
                          >
                            Clear Filters
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No questions created yet</p>
                      <Button variant="outline" className="mt-4" onClick={() => navigate("/teacher/add-question")}>
                        Create Your First Question
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <AlertDialog open={!!questionToDelete} onOpenChange={(open) => !open && setQuestionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this question? This action cannot be undone.
              If this question is used in any exams, it will also be removed from those exams.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteQuestion} className="bg-red-500 text-white hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AddQuestion;
