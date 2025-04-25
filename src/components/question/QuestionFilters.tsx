
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
  // Extract unique chapter names and CO numbers
  const uniqueChapters = [...new Set(questions.map(q => q.chapterName))].filter(Boolean);
  const uniqueCOs = [...new Set(questions.map(q => q.coNumber))].filter(Boolean);
  
  // Subject options (CO and CA with 6 options each)
  const coOptions = Array.from({ length: 6 }, (_, i) => `CO${i + 1}`);
  const caOptions = Array.from({ length: 6 }, (_, i) => `CA${i + 1}`);
  
  // State for selected subject
  const [selectedSubject, setSelectedSubject] = useState<string>("");

  // Create filter options
  const [chapterFilters, setChapterFilters] = useState<FilterOption[]>(
    uniqueChapters.map(chapter => ({
      value: chapter,
      label: chapter,
      checked: false
    }))
  );

  const [coFilters, setCoFilters] = useState<FilterOption[]>(
    uniqueCOs.map(co => ({
      value: co,
      label: co,
      checked: false
    }))
  );

  // Update filters when questions change
  useEffect(() => {
    const newUniqueChapters = [...new Set(questions.map(q => q.chapterName))].filter(Boolean);
    const newUniqueCOs = [...new Set(questions.map(q => q.coNumber))].filter(Boolean);

    setChapterFilters(prev => {
      // Keep existing selections
      const existingValues = new Set(prev.map(p => p.value));
      const newOptions = newUniqueChapters
        .filter(chapter => !existingValues.has(chapter))
        .map(chapter => ({
          value: chapter,
          label: chapter,
          checked: false
        }));
      
      return [...prev, ...newOptions];
    });

    setCoFilters(prev => {
      // Keep existing selections
      const existingValues = new Set(prev.map(p => p.value));
      const newOptions = newUniqueCOs
        .filter(co => !existingValues.has(co))
        .map(co => ({
          value: co,
          label: co,
          checked: false
        }));
      
      return [...prev, ...newOptions];
    });
  }, [questions]);

  const applyFilters = () => {
    const selectedChapters = chapterFilters.filter(f => f.checked).map(f => f.value);
    const selectedCOs = coFilters.filter(f => f.checked).map(f => f.value);

    let filteredQuestions = [...questions];

    if (selectedChapters.length > 0) {
      filteredQuestions = filteredQuestions.filter(q => 
        selectedChapters.includes(q.chapterName)
      );
    }

    if (selectedCOs.length > 0) {
      filteredQuestions = filteredQuestions.filter(q => 
        selectedCOs.includes(q.coNumber)
      );
    }
    
    // Apply subject filter if selected
    if (selectedSubject) {
      filteredQuestions = filteredQuestions.filter(q => 
        q.coNumber === selectedSubject
      );
    }

    onFilterChange(filteredQuestions);
  };

  const clearFilters = () => {
    setChapterFilters(prev => prev.map(f => ({ ...f, checked: false })));
    setCoFilters(prev => prev.map(f => ({ ...f, checked: false })));
    setSelectedSubject("");
    onFilterChange(questions);
  };
  const subjectFullNames = {
    "CO1": "Computer Organisation Outcome 1",
    "CO2": "Computer Organisation Outcome 2",
    "CO3": "Computer Organisation Outcome 3",
    "CO4": "Computer Organisation Outcome 4",
    "CO5": "Computer Organisation Outcome 5",
    "CO6": "Computer Organisation Outcome 6",
    "CA1": "Computer Architecture Assessment 1",
    "CA2": "Computer Architecture Assessment 2",
    "CA3": "Computer Architecture Assessment 3",
    "CA4": "Computer Architecture Assessment 4",
    "CA5": "Computer Architecture Assessment 5",
    "CA6": "Computer Architecture Assessment 6",
    // Add more COs and CAs as needed
  };
  const handleChapterChange = (value: string) => {
    setChapterFilters(prev => 
      prev.map(filter => 
        filter.value === value ? { ...filter, checked: !filter.checked } : filter
      )
    );
  };

  const handleCOChange = (value: string) => {
    setCoFilters(prev => 
      prev.map(filter => 
        filter.value === value ? { ...filter, checked: !filter.checked } : filter
      )
    );
  };
  
  const handleSubjectChange = (value: string) => {
    setSelectedSubject(value);
  };

  const activeFiltersCount = 
    chapterFilters.filter(f => f.checked).length + 
    coFilters.filter(f => f.checked).length + 
    (selectedSubject ? 1 : 0);

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

          {/* Chapter Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                TOPIC
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-4" align="start">
              <div className="space-y-2">
                <h4 className="font-medium">Filter by Chapter</h4>
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
                    <p className="text-sm text-gray-500">No chapters available</p>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* CO Number Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                CO Numbers
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-4" align="start">
              <div className="space-y-2">
                <h4 className="font-medium">Filter by CO Number</h4>
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
                          {filter.label}
                        </Label>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No CO numbers available</p>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Subject Dropdown */}
          {/* Subject Dropdown */}
<div className="w-48">
  <Select value={selectedSubject} onValueChange={handleSubjectChange}>
    <SelectTrigger className="h-8">
      <SelectValue placeholder="Select Subject" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Subjects</SelectItem>
      <SelectItem value="co" disabled className="font-medium text-muted-foreground">Course Outcomes</SelectItem>
      {coOptions.map(co => (
        <SelectItem key={co} value={co}>{subjectFullNames[co] || co}</SelectItem>
      ))}
      <SelectItem value="ca" disabled className="font-medium text-muted-foreground">Course Assessments</SelectItem>
      {caOptions.map(ca => (
        <SelectItem key={ca} value={ca}>{subjectFullNames[ca] || ca}</SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>

          <Button variant="outline" size="sm" className="h-8" onClick={applyFilters}>
            Apply Filters
          </Button>

          {activeFiltersCount > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 text-gray-500" 
              onClick={clearFilters}
            >
              Clear
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionFilters;
