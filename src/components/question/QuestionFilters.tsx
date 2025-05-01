// Apply filters whenever questions change
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { ChevronDown, Filter } from "lucide-react";

interface FilterOption {
  value: string;
  label: string;
  checked: boolean;
}

interface QuestionFiltersProps {
  questions: any[];
  onFilterChange: (filteredQuestions: any[]) => void;
}

const QuestionFilters = ({ questions, onFilterChange }: QuestionFiltersProps) => {
  // Define subjects - these must match exactly with the add question form
  const subjects = [
    { value: "CO", label: "Computer Organization" },
    { value: "CA", label: "Computer Architecture" }
  ];

  // State for selected filters
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [chapterFilters, setChapterFilters] = useState<FilterOption[]>([]);
  const [coFilters, setCoFilters] = useState<FilterOption[]>([]);

  useEffect(() => {
    applyFilters();
  }, [questions]);

  // Extract unique chapter names based on subject
  useEffect(() => {
    if (selectedSubject) {
      // Filter questions by selected subject
      const subjectQuestions = questions.filter(q =>
        q.subject === selectedSubject
      );

      // Get unique chapters from the filtered questions
      const subjectChapters = [...new Set(subjectQuestions.map(q => q.chapterName))].filter(Boolean);

      setChapterFilters(
        subjectChapters.map(chapter => ({
          value: chapter,
          label: chapter,
          checked: false
        }))
      );

      // Set CO options based on selected subject (CO1-CO6)
      setCoFilters(
        Array.from({ length: 6 }, (_, i) => {
          const coValue = `CO${i + 1}`;
          return {
            value: coValue,
            label: coValue,
            checked: false
          };
        })
      );
    } else {
      // When no subject is selected, show all chapters
      const allChapters = [...new Set(questions.map(q => q.chapterName))].filter(Boolean);
      setChapterFilters(
        allChapters.map(chapter => ({
          value: chapter,
          label: chapter,
          checked: false
        }))
      );

      // When no subject is selected, show all COs starting with CO
      const allCOs = questions.map(q => q.coNumber).filter(Boolean).filter(co => co.startsWith("CO"));
      const uniqueCOs = [...new Set(allCOs)];
      setCoFilters(
        uniqueCOs.map(co => ({
          value: co,
          label: co,
          checked: false
        }))
      );
    }
  }, [selectedSubject, questions]);

  const getFullCourseName = (code) => {
    const courseOutcomes = {
      "CO1": "CO1",
      "CO2": "CO2",
      "CO3": "CO3",
      "CO4": "CO4",
      "CO5": "CO5",
      "CO6": "CO6",
    };

    return courseOutcomes[code] || code;
  };

  const handleChapterChange = (value: string) => {
    setChapterFilters(prev => {
      const newFilters = prev.map(filter =>
        filter.value === value ? { ...filter, checked: !filter.checked } : filter
      );
      // Auto-apply filters after change
      setTimeout(() => applyFilters(newFilters, coFilters, selectedSubject), 0);
      return newFilters;
    });
  };

  const handleCOChange = (value: string) => {
    setCoFilters(prev => {
      const newFilters = prev.map(filter =>
        filter.value === value ? { ...filter, checked: !filter.checked } : filter
      );
      // Auto-apply filters after change
      setTimeout(() => applyFilters(chapterFilters, newFilters, selectedSubject), 0);
      return newFilters;
    });
  };

  const handleSubjectChange = (value: string) => {
    // Handle the "all" value by setting empty string for internal state
    const newSubject = value === "all" ? "" : value;
    setSelectedSubject(newSubject);
    // Reset other filters when subject changes
    setChapterFilters([]);
    setCoFilters([]);
    // Auto-apply filter
    setTimeout(() => applyFilters([], [], newSubject), 0);
  };

  const applyFilters = (
    chapFilters = chapterFilters,
    courseFilters = coFilters,
    subject = selectedSubject
  ) => {
    const selectedChapters = chapFilters.filter(f => f.checked).map(f => f.value);
    const selectedCOs = courseFilters.filter(f => f.checked).map(f => f.value);

    let filteredQuestions = [...questions];

    // Apply subject filter
    if (subject) {
      filteredQuestions = filteredQuestions.filter(q => q.subject === subject);
    }

    // Apply chapter filter
    if (selectedChapters.length > 0) {
      filteredQuestions = filteredQuestions.filter(q =>
        q.chapterName && selectedChapters.includes(q.chapterName)
      );
    }

    // Apply CO filter
    if (selectedCOs.length > 0) {
      filteredQuestions = filteredQuestions.filter(q =>
        q.coNumber && selectedCOs.includes(q.coNumber)
      );
    }

    // Pass the filtered questions back to the parent component
    onFilterChange(filteredQuestions);
  };

  const clearFilters = () => {
    setSelectedSubject("");
    setChapterFilters(prev => prev.map(f => ({ ...f, checked: false })));
    setCoFilters(prev => prev.map(f => ({ ...f, checked: false })));
    // Apply the cleared filters
    setTimeout(() => onFilterChange(questions), 0);
  };

  const activeFiltersCount =
    (selectedSubject ? 1 : 0) +
    chapterFilters.filter(f => f.checked).length +
    coFilters.filter(f => f.checked).length;

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            <span className="font-medium">Filters</span>
            {activeFiltersCount > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                {activeFiltersCount}
              </span>
            )}
          </div>

          {/* Subject Filter */}
          <div className="w-48">
            <Select value={selectedSubject === "" ? "all" : selectedSubject} onValueChange={handleSubjectChange}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map(subject => (
                  <SelectItem key={subject.value} value={subject.value}>{subject.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Chapter Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                Chapter
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-4" align="start">
              <div className="space-y-2">
                <h4 className="font-medium">Filter by Topic/Chapter</h4>
                <div className="max-h-[200px] overflow-y-auto space-y-2">
                  {chapterFilters.length > 0 ? (
                    chapterFilters.map((filter) => (
                      <div key={filter.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`chapter-${filter.value}`}
                          checked={filter.checked}
                          onCheckedChange={() => handleChapterChange(filter.value)}
                        />
                        <Label htmlFor={`chapter-${filter.value}`} className="text-sm">
                          {filter.label}
                        </Label>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">
                      {selectedSubject ? "No topics available for this subject" : "Select a subject first"}
                    </p>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Course Outcome/Assessment Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                CO
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-22 p-4" align="center">
              <div className="space-y-2">
                <h4 className="font-medium">Filter by Course Outcomes</h4>
                <div className="max-h-[200px] overflow-y-auto space-y-2">
                  {coFilters.length > 0 ? (
                    coFilters.map((filter) => (
                      <div key={filter.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`co-${filter.value}`}
                          checked={filter.checked}
                          onCheckedChange={() => handleCOChange(filter.value)}
                        />
                        <Label htmlFor={`co-${filter.value}`} className="text-sm">
                          {getFullCourseName(filter.value)}
                        </Label>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">
                      {selectedSubject ? "No COs available for this subject" : "Select a subject first"}
                    </p>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button variant="outline" size="sm" className="h-8 ml-auto" onClick={() => applyFilters()}>
            Refresh Filters
          </Button>

          {activeFiltersCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-gray-500"
              onClick={clearFilters}
            >
              Clear All
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionFilters;