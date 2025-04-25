
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { StudentExamSubmission, Question } from "@/utils/examTypes";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StudentExamDetailsProps {
  submission: StudentExamSubmission;
  questions: Question[];
  open: boolean;
  onClose: () => void;
}

const StudentExamDetails = ({ submission, questions, open, onClose }: StudentExamDetailsProps) => {
  const [activeQuestion, setActiveQuestion] = useState(0);

  // Make sure questions are in the same order as they were in the exam
  const orderedQuestions = submission.answers.map(answer => {
    const question = questions.find(q => q.id === answer.questionId);
    return {
      question,
      selectedOptions: answer.selectedOptions
    };
  }).filter(item => item.question) as { question: Question; selectedOptions: string[] }[];

  const handleNext = () => {
    if (activeQuestion < orderedQuestions.length - 1) {
      setActiveQuestion(activeQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (activeQuestion > 0) {
      setActiveQuestion(activeQuestion - 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px] h-[90vh] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Exam Results: {submission.examTitle}</DialogTitle>
          <DialogDescription>
            Score: {submission.score}/{submission.totalMarks} ({Math.round((submission.score/submission.totalMarks)*100)}%)
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-auto pr-4 max-h-[calc(90vh-180px)]">
          {submission.feedback && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md mb-4">
              <h4 className="font-medium mb-1">Teacher Feedback:</h4>
              <p className="text-sm">{submission.feedback}</p>
            </div>
          )}

          {orderedQuestions.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">
                  Question {activeQuestion + 1} of {orderedQuestions.length}
                </h3>
                <div className="flex gap-1 flex-wrap justify-end">
                  {orderedQuestions.map((_, index) => (
                    <button
                      key={index}
                      className={`w-6 h-6 rounded-full text-xs flex items-center justify-center ${
                        index === activeQuestion 
                          ? "bg-blue-500 text-white" 
                          : "bg-gray-200 text-gray-700"
                      }`}
                      onClick={() => setActiveQuestion(index)}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                {orderedQuestions[activeQuestion].question.correctAnswers.length > 1 && (
                  <div className="mb-2">
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                      Multiple Select Question (MSQ)
                    </Badge>
                  </div>
                )}
                <p className="font-medium mb-4">{orderedQuestions[activeQuestion].question.text}</p>
                
                {orderedQuestions[activeQuestion].question.image && (
                  <div className="my-4 max-w-md mx-auto">
                    <img
                      src={orderedQuestions[activeQuestion].question.image}
                      alt="Question illustration"
                      className="rounded-lg border w-full max-h-[200px] object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null; 
                        target.src = '/placeholder.svg';
                      }}
                    />
                  </div>
                )}
                
                <div className="space-y-2 mb-4">
                  {orderedQuestions[activeQuestion].question.options.map(option => {
                    const isSelected = orderedQuestions[activeQuestion].selectedOptions.includes(option.id);
                    const isCorrect = orderedQuestions[activeQuestion].question.correctAnswers.includes(option.id);
                    
                    return (
                      <div 
                        key={option.id}
                        className={`p-2 rounded-md flex items-start ${
                          isSelected && isCorrect 
                            ? "bg-green-50 border border-green-200"
                            : isSelected && !isCorrect
                              ? "bg-red-50 border border-red-200"
                              : !isSelected && isCorrect
                                ? "bg-blue-50 border border-blue-200"
                                : "bg-gray-50 border border-gray-200"
                        }`}
                      >
                        <div className="mr-2 mt-0.5">
                          {isSelected && isCorrect && <Check className="h-4 w-4 text-green-600" />}
                          {isSelected && !isCorrect && <X className="h-4 w-4 text-red-600" />}
                          {!isSelected && isCorrect && <Check className="h-4 w-4 text-blue-600" />}
                        </div>
                        <span>{option.text}</span>
                      </div>
                    );
                  })}
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="bg-gray-50">
                    {orderedQuestions[activeQuestion].question.marks} marks
                  </Badge>
                  <Badge variant="outline" className="bg-gray-50">
                    {orderedQuestions[activeQuestion].question.chapterName}
                  </Badge>
                  <Badge variant="outline" className="bg-gray-50">
                    {orderedQuestions[activeQuestion].question.coNumber}
                  </Badge>
                </div>
              </div>
              
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={activeQuestion === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={handleNext}
                  disabled={activeQuestion === orderedQuestions.length - 1}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </ScrollArea>
        
        <DialogFooter className="mt-4 pt-4 border-t">
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StudentExamDetails;
