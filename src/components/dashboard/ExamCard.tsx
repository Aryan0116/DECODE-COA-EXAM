import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Exam } from "@/utils/examTypes";

type ExamCardProps = {
  exam: Exam;
  onEdit: () => void;
  onDelete: () => void;
};

// Memoized to prevent unnecessary re-renders
const ExamCard = memo(({ exam, onEdit, onDelete }: ExamCardProps) => {
  return (
    <div className="border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
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
            onClick={onEdit}
          >
            Edit
          </Button>
          <Button 
            size="sm" 
            variant="ghost"
            className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
});

ExamCard.displayName = "ExamCard";

export default ExamCard;