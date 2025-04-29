export interface Option {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  text: string;
  options: Option[];
  correctAnswers: string[]; // Array of option IDs
  marks: number;
  chapterName: string;
  coNumber: string; // Course Outcome number
  subject: string;
  image?: string;
  createdBy?: string; // Add this for tracking who created the question
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  secretCode: string;
  duration: number; // in minutes
  totalMarks: number;
  createdBy: string; // user ID
  questions: Question[];
  isActive: boolean;
  createdAt: Date;
  leaderboardReleased: boolean;
}

export interface StudentExamAnswer {
  questionId: string;
  selectedOptions: string[]; // Array of option IDs
}

export interface StudentExamSubmission {
  id: string;
  studentId: string;
  studentName: string;
  studentRollNumber: string;
  studentPhone: string;
  examId: string;
  examTitle: string;
  answers: StudentExamAnswer[];
  startTime: Date;
  endTime: Date;
  score: number;
  totalMarks: number;
  released: boolean; // Whether the result has been released to the student
  feedback?: string; // Feedback from the teacher
  chapterPerformance?: Record<string, { score: number, total: number }>;
  coPerformance?: Record<string, { score: number, total: number }>;
}

// Performance analytics interfaces
export interface ChapterPerformance {
  chapterName: string;
  score: number;
  totalMarks: number;
  percentage: number;
}

export interface COPerformance {
  coNumber: string;
  score: number;
  totalMarks: number;
  percentage: number;
}

export interface StudentPerformanceAnalytics {
  studentId: string;
  examId: string;
  overallScore: number;
  overallPercentage: number;
  totalMarks: number;
  chapterPerformance: ChapterPerformance[];
  coPerformance: COPerformance[];
}

// Mock questions data
export const mockQuestions: Question[] = [
  {
    id: "q1",
    text: "What is the capital of France?",
    options: [
      { id: "q1o1", text: "London" },
      { id: "q1o2", text: "Paris" },
      { id: "q1o3", text: "Berlin" },
      { id: "q1o4", text: "Madrid" }
    ],
    correctAnswers: ["q1o2"],
    marks: 2,
    chapterName: "Geography",
    coNumber: "CO1",
    subject: "Computer Organisation",
  },
  {
    id: "q2",
    text: "Which of the following are primary colors?",
    options: [
      { id: "q2o1", text: "Red" },
      { id: "q2o2", text: "Green" },
      { id: "q2o3", text: "Blue" },
      { id: "q2o4", text: "Orange" }
    ],
    correctAnswers: ["q2o1", "q2o3"],
    marks: 3,
    chapterName: "Art",
    coNumber: "CO2",
    subject: "Computer Organisation",
  },
  {
    id: "q3",
    text: "What is the formula for water?",
    options: [
      { id: "q3o1", text: "H2O" },
      { id: "q3o2", text: "CO2" },
      { id: "q3o3", text: "NaCl" },
      { id: "q3o4", text: "H2SO4" }
    ],
    correctAnswers: ["q3o1"],
    marks: 2,
    chapterName: "Chemistry",
    coNumber: "CO3",
    subject: "Computer Organisation",
  },
];

// Mock exams data
export const mockExams: Exam[] = [
  {
    id: "e1",
    title: "Geography Quiz",
    description: "Test your knowledge of world geography",
    secretCode: "GEO123",
    duration: 30,
    totalMarks: 10,
    createdBy: "t1",
    questions: [mockQuestions[0]],
    isActive: true,
    createdAt: new Date("2023-04-15"),
    leaderboardReleased: false,
  },
  {
    id: "e2",
    title: "Science Fundamentals",
    description: "Basic concepts in science",
    secretCode: "SCI456",
    duration: 45,
    totalMarks: 20,
    createdBy: "t1",
    questions: [mockQuestions[1], mockQuestions[2]],
    isActive: true,
    createdAt: new Date("2023-04-20"),
    leaderboardReleased: false,
  },
];

// Mock submissions data
export const mockSubmissions: StudentExamSubmission[] = [
  {
    id: "sub1",
    studentId: "s1",
    studentName: "John Doe",
    studentRollNumber: "12345",
    studentPhone: "555-1234",
    examId: "e1",
    examTitle: "Geography Quiz",
    answers: [
      {
        questionId: "q1",
        selectedOptions: ["q1o2"],
      },
    ],
    startTime: new Date("2023-05-01T10:00:00"),
    endTime: new Date("2023-05-01T10:30:00"),
    score: 2,
    totalMarks: 2,
    released: false,
    feedback: "",
  },
];
