import { supabase } from "@/integrations/supabase/client";
import { Exam, StudentExamSubmission, Question, StudentExamAnswer, Option } from "./examTypes";
import { User, UserRole } from "../context/AuthContext";
import { v4 as uuidv4 } from 'uuid';
import { Json } from "@/integrations/supabase/types";

export async function getUsers(): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) throw error;

    return (data || []).map(profile => ({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      phone: profile.phone || '',
      role: profile.role as UserRole,
      isActive: true,
      createdAt: profile.created_at
    }));
  } catch (error) {
    // console.error("Error getting users:", error);
    return [];
  }
}

export async function saveUser(user: User): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      });

    if (error) throw error;
    return true;
  } catch (error) {
    // console.error("Error saving user:", error);
    return false;
  }
}

export async function deleteUser(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    // console.error("Error deleting user:", error);
    return false;
  }
}

export async function getExams(): Promise<Exam[]> {
  try {
    // console.log("Fetching exams");
    
    const { data: examsData, error: examsError } = await supabase
      .from('exams')
      .select('*');

    if (examsError) {
      // console.error("Error fetching exams:", examsError);
      throw examsError;
    }

    // console.log(`Found ${examsData?.length || 0} exams`);
    
    const exams: Exam[] = [];
    
    for (const exam of examsData || []) {
      // console.log(`Processing exam: ${exam.id} - ${exam.title}`);
      
      const { data: examQuestionsData, error: examQuestionsError } = await supabase
        .from('exam_questions')
        .select('question_id')
        .eq('exam_id', exam.id);
      
      if (examQuestionsError) {
        // console.error(`Error fetching question IDs for exam ${exam.id}:`, examQuestionsError);
        throw examQuestionsError;
      }
      
      const questionIds = examQuestionsData?.map(item => item.question_id) || [];
      
      let questions: Question[] = [];
      
      if (questionIds.length > 0) {
        // console.log(`Found ${questionIds.length} question IDs for exam ${exam.id}`);
        
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .in('id', questionIds);
        
        if (questionsError) {
          // console.error(`Error fetching questions for exam ${exam.id}:`, questionsError);
          throw questionsError;
        }
        
        if (questionsData && questionsData.length > 0) {
          // console.log(`Fetched ${questionsData.length} questions for exam ${exam.id}`);
          
          questions = questionsData.map(q => ({
            id: q.id,
            text: q.question_text,
            options: q.options ? (q.options as unknown as Option[]) : [],
            correctAnswers: q.correct_answers || [],
            marks: q.marks || 1,
            chapterName: q.chapter_name || '',
            coNumber: q.co_number || '',
            image: q.image || null,
            createdBy: q.created_by
          }));
        }
      } else {
        // console.log(`No questions found for exam ${exam.id}`);
      }
      
      exams.push({
        id: exam.id,
        title: exam.title,
        description: exam.description || '',
        secretCode: exam.secret_code,
        duration: exam.duration,
        totalMarks: exam.total_marks,
        createdBy: exam.created_by,
        questions: questions,
        isActive: exam.is_active,
        createdAt: new Date(exam.created_at),
        leaderboardReleased: exam.leaderboard_released
      });
    }

    // console.log(`Returning ${exams.length} exams with their questions`);
    return exams;
  } catch (error) {
    // console.error("Error getting exams:", error);
    return [];
  }
}

export async function saveExam(exam: Omit<Exam, 'questions'> & { questions: string[] }): Promise<boolean> {
  try {
    // console.log("Saving exam:", exam.title, "with questions:", exam.questions);
    
    const { data: examData, error: examError } = await supabase
      .from('exams')
      .upsert({
        id: exam.id || uuidv4(),
        title: exam.title,
        description: exam.description,
        secret_code: exam.secretCode,
        duration: exam.duration,
        total_marks: exam.totalMarks,
        created_by: exam.createdBy,
        is_active: exam.isActive,
        created_at: exam.createdAt.toISOString(),
        leaderboard_released: exam.leaderboardReleased
      })
      .select()
      .single();

    if (examError) {
      // console.error("Error saving exam data:", examError);
      throw examError;
    }

    // console.log("Exam data saved successfully, ID:", examData.id);

    if (examData && exam.questions.length > 0) {
      const { error: deleteError } = await supabase
        .from('exam_questions')
        .delete()
        .eq('exam_id', examData.id);

      if (deleteError) {
        // console.error("Error deleting existing exam questions:", deleteError);
        throw deleteError;
      }

      // console.log("Deleted existing question associations");

      const examQuestionsData = exam.questions.map(questionId => ({
        exam_id: examData.id,
        question_id: questionId
      }));

      // console.log("Adding new question associations:", examQuestionsData);

      const { error: insertError } = await supabase
        .from('exam_questions')
        .insert(examQuestionsData);

      if (insertError) {
        // console.error("Error inserting exam questions:", insertError);
        throw insertError;
      }
      
      // console.log("Successfully associated questions with exam");
    } else {
      // console.log("No questions to associate with exam");
    }

    return true;
  } catch (error) {
    // console.error("Error saving exam:", error);
    return false;
  }
}

export async function deleteExam(examId: string): Promise<boolean> {
  try {
    const { error: eqError } = await supabase
      .from('exam_questions')
      .delete()
      .eq('exam_id', examId);

    // if (eqError) console.error("Error deleting exam questions:", eqError);

    const { error: resultsError } = await supabase
      .from('exam_results')
      .delete()
      .eq('exam_id', examId);

    // if (resultsError) console.error("Error deleting exam results:", resultsError);

    const { error: examError } = await supabase
      .from('exams')
      .delete()
      .eq('id', examId);

    if (examError) throw examError;

    return true;
  } catch (error) {
    // console.error("Error deleting exam:", error);
    return false;
  }
}

export async function getExamResults(): Promise<StudentExamSubmission[]> {
  try {
    const { data, error } = await supabase
      .from('exam_results')
      .select(`
        *,
        exams(title)
      `);

    if (error) throw error;
    
    return (data || []).map(result => ({
      id: result.id,
      studentId: result.student_id,
      studentName: result.student_name,
      studentRollNumber: result.student_roll_number || '',
      studentPhone: result.student_phone || '',
      examId: result.exam_id,
      examTitle: result.exams?.title || 'Unknown Exam',
      answers: result.answers ? (result.answers as unknown as StudentExamAnswer[]) : [],
      startTime: new Date(result.created_at),
      endTime: result.end_time ? new Date(result.end_time) : new Date(),
      score: result.score,
      totalMarks: result.total_marks,
      released: result.released,
      feedback: result.feedback
    }));
  } catch (error) {
    // console.error("Error getting exam results:", error);
    return [];
  }
}

export async function saveExamResult(result: StudentExamSubmission): Promise<boolean> {
  try {
    // console.log("Saving exam result:", result);
    
    const resultId = result.id || uuidv4();
    
    const { error } = await supabase
      .from('exam_results')
      .upsert({
        id: resultId,
        student_id: result.studentId,
        student_name: result.studentName,
        student_roll_number: result.studentRollNumber,
        student_phone: result.studentPhone,
        exam_id: result.examId,
        answers: result.answers as unknown as Json,
        score: result.score,
        total_marks: result.totalMarks,
        end_time: result.endTime.toISOString(),
        released: result.released,
        feedback: result.feedback || null
      });

    if (error) {
      // console.error("Supabase error saving exam result:", error);
      throw error;
    }
    
    // console.log("Exam result saved successfully");
    return true;
  } catch (error) {
    // console.error("Error saving exam result:", error);
    return false;
  }
}

export async function addFeedbackToResult(submissionId: string, feedback: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('exam_results')
      .update({ feedback })
      .eq('id', submissionId);

    if (error) throw error;
    return true;
  } catch (error) {
    // console.error("Error adding feedback to result:", error);
    return false;
  }
}

export async function releaseExamResults(submissionId: string, released: boolean): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('exam_results')
      .update({ released })
      .eq('id', submissionId);

    if (error) throw error;
    return true;
  } catch (error) {
    // console.error("Error releasing exam results:", error);
    return false;
  }
}

export async function getQuestions(): Promise<Question[]> {
  try {
    // console.log("Fetching all questions");
    const { data, error } = await supabase
      .from('questions')
      .select('*');

    if (error) {
      // console.error("Error fetching questions:", error);
      throw error;
    }

    // console.log(`Successfully fetched ${data?.length || 0} questions`);
    return (data || []).map(item => ({
      id: item.id,
      text: item.question_text,
      options: item.options ? (item.options as unknown as Option[]) : [],
      correctAnswers: item.correct_answers || [],
      marks: item.marks || 1,
      chapterName: item.chapter_name || '',
      coNumber: item.co_number || '',
      image: item.image || null,
      createdBy: item.created_by
    }));
  } catch (error) {
    // console.error("Error getting questions:", error);
    return [];
  }
}

export async function saveQuestion(question: Question): Promise<boolean> {
  try {
    const questionId = question.id && question.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) 
      ? question.id 
      : uuidv4();
    
    // console.log("Saving question with ID:", questionId, "Text:", question.text);
    
    let imagePath = question.image;
    
    if (question.image && question.image.startsWith('data:image')) {
      try {
        const matches = question.image.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
          throw new Error("Invalid image data URL");
        }
        
        const fileExt = matches[1];
        const base64Data = matches[2];
        const fileName = `question_${questionId}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('questions')
          .upload(fileName, base64Data, {
            contentType: `image/${fileExt}`,
            upsert: true
          });
        
        if (uploadError) {
          throw uploadError;
        }
        
        const { data: urlData } = await supabase.storage
          .from('questions')
          .getPublicUrl(fileName);
        
        imagePath = urlData.publicUrl;
      } catch (imageError) {
        // console.error("Error uploading image:", imageError);
      }
    }
    
    const { error } = await supabase
      .from('questions')
      .upsert({
        id: questionId,
        question_text: question.text,
        options: question.options as unknown as Json,
        correct_answers: question.correctAnswers,
        marks: question.marks,
        chapter_name: question.chapterName,
        co_number: question.coNumber,
        image: imagePath,
        created_by: question.createdBy
      });

    if (error) {
      // console.error("Error saving question:", error);
      throw error;
    }
    
    // console.log("Question saved successfully");
    return true;
  } catch (error) {
    // console.error("Error saving question:", error);
    return false;
  }
}

export async function deleteQuestion(questionId: string): Promise<boolean> {
  try {
    const { error: examQuestionError } = await supabase
      .from('exam_questions')
      .delete()
      .eq('question_id', questionId);
    
    // if (examQuestionError) console.error("Error removing question from exams:", examQuestionError);

    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', questionId);

    if (error) throw error;
    return true;
  } catch (error) {
    // console.error("Error deleting question:", error);
    return false;
  }
}

export async function getLeaderboard(examId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .eq('exam_id', examId)
      .order('score', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    // console.error("Error getting leaderboard:", error);
    return [];
  }
}

export async function saveLeaderboardEntry(examId: string, userId: string, score: number, studentName: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('leaderboard')
      .upsert({ 
        exam_id: examId, 
        user_id: userId, 
        score: score, 
        student_name: studentName 
      });

    if (error) throw error;
    return true;
  } catch (error) {
    // console.error("Error saving leaderboard entry:", error);
    return false;
  }
}

export async function toggleLeaderboard(examId: string, released: boolean): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('exams')
      .update({ leaderboard_released: released })
      .eq('id', examId);

    if (error) throw error;
    return true;
  } catch (error) {
    // console.error("Error toggling leaderboard:", error);
    return false;
  }
}

export async function saveExams(exams: Exam[]): Promise<boolean> {
  try {
    // console.log("Saving multiple exams:", exams.length);
    
    for (const exam of exams) {
      const questionIds = exam.questions.map(q => q.id);
      // console.log(`Saving exam ${exam.title} with ${questionIds.length} questions`);
      
      await saveExam({
        ...exam,
        questions: questionIds
      });
    }
    return true;
  } catch (error) {
    // console.error("Error saving exams:", error);
    return false;
  }
}

export async function saveQuestions(questions: Question[]): Promise<boolean> {
  try {
    for (const question of questions) {
      await saveQuestion(question);
    }
    return true;
  } catch (error) {
    // console.error("Error saving questions:", error);
    return false;
  }
}

export async function saveExamResults(results: StudentExamSubmission[]): Promise<boolean> {
  try {
    for (const result of results) {
      await saveExamResult(result);
    }
    return true;
  } catch (error) {
    // console.error("Error saving exam results:", error);
    return false;
  }
}

export async function getExamResultsByExamId(examId: string): Promise<StudentExamSubmission[]> {
  try {
    const { data, error } = await supabase
      .from('exam_results')
      .select('*, exams(title)')
      .eq('exam_id', examId)
      .order('created_at', { ascending: false });

    if (error) {
      // console.error("Error fetching exam results:", error);
      return [];
    }

    return (data || []).map(result => ({
      id: result.id,
      studentId: result.student_id || "",
      studentName: result.student_name,
      examId: result.exam_id || "",
      examTitle: result.exams ? result.exams.title : "",
      answers: result.answers as unknown as StudentExamAnswer[],
      startTime: new Date(result.created_at),
      endTime: result.end_time ? new Date(result.end_time) : new Date(),
      score: result.score,
      totalMarks: result.total_marks,
      released: result.released || false,
      feedback: result.feedback || "",
    }));
  } catch (error) {
    // console.error("Unexpected error fetching exam results:", error);
    return [];
  }
}

export async function calculatePerformanceAnalytics(examId: string): Promise<any> {
  try {
    const results = await getExamResultsByExamId(examId);

    if (!results || results.length === 0) {
      return {
        averageScore: 0,
        totalSubmissions: 0,
        highestScore: 0,
        lowestScore: 0,
        scoreDistribution: []
      };
    }

    const totalScore = results.reduce((sum, result) => sum + result.score, 0);
    const averageScore = totalScore / results.length;

    const highestScore = Math.max(...results.map(result => result.score));
    const lowestScore = Math.min(...results.map(result => result.score));

    const scoreDistribution = calculateScoreDistribution(results);

    return {
      averageScore,
      totalSubmissions: results.length,
      highestScore,
      lowestScore,
      scoreDistribution
    };
  } catch (error) {
    // console.error("Error calculating performance analytics:", error);
    return null;
  }
}

const calculateScoreDistribution = (results: StudentExamSubmission[]): { range: string; count: number }[] => {
  const ranges = [
    { min: 0, max: 20, range: '0-20%' },
    { min: 21, max: 40, range: '21-40%' },
    { min: 41, max: 60, range: '41-60%' },
    { min: 61, max: 80, range: '61-80%' },
    { min: 81, max: 100, range: '81-100%' }
  ];

  const distribution = ranges.map(range => {
    const count = results.filter(result => {
      const percentage = (result.score / result.totalMarks) * 100;
      return percentage >= range.min && percentage <= range.max;
    }).length;

    return { range: range.range, count };
  });

  return distribution;
};

export async function getExamPerformanceStats(examId: string): Promise<any> {
  try {
    const results = await getExamResultsByExamId(examId);
    const questions = await getQuestions();

    if (!results || results.length === 0 || !questions || questions.length === 0) {
      return {
        questionsWithMostErrors: [],
        averageCompletionTime: 0,
        topPerformers: [],
        timeDistribution: [],
        scoreTrends: []
      };
    }

    const questionsWithMostErrors = calculateQuestionsWithMostErrors(results, questions);

    const averageCompletionTime = calculateAverageCompletionTime(results);

    const topPerformers = calculateTopPerformers(results);

    const timeDistribution = calculateTimeDistribution(results);

    const scoreTrends = calculateScoreTrends(results);

    return {
      questionsWithMostErrors,
      averageCompletionTime,
      topPerformers,
      timeDistribution,
      scoreTrends
    };
  } catch (error) {
    // console.error("Error calculating exam performance stats:", error);
    return null;
  }
}

const calculateQuestionsWithMostErrors = (results: StudentExamSubmission[], questions: Question[]): any[] => {
  const questionErrorCounts: Record<string, number> = {};
  const questionAttemptCounts: Record<string, number> = {};
  
  const questionNumberMap: Record<string, number> = {};
  
  questions.forEach((question, index) => {
    questionNumberMap[question.id] = index + 1;
  });

  results.forEach(result => {
    if (result.answers && Array.isArray(result.answers)) {
      result.answers.forEach((answer: any) => {
        if (answer && answer.questionId) {
          questionAttemptCounts[answer.questionId] = (questionAttemptCounts[answer.questionId] || 0) + 1;
          
          if (!answer.isCorrect) {
            questionErrorCounts[answer.questionId] = (questionErrorCounts[answer.questionId] || 0) + 1;
          }
        }
      });
    }
  });

  const questionsWithErrors = Object.keys(questionAttemptCounts).map(questionId => {
    const errorCount = questionErrorCounts[questionId] || 0;
    const attemptCount = questionAttemptCounts[questionId];
    const question = questions.find(q => q.id === questionId);
    
    const errorRate = (errorCount / attemptCount) * 100;
    
    return {
      questionId,
      questionNumber: questionNumberMap[questionId],
      questionText: question ? question.text : 'Unknown Question',
      errorCount,
      attemptCount,
      errorRate: isNaN(errorRate) ? 0 : errorRate
    };
  });

  return questionsWithErrors
    .sort((a, b) => b.errorRate - a.errorRate)
    .slice(0, 5);
};

const calculateAverageCompletionTime = (results: StudentExamSubmission[]): number => {
  const validResults = results.filter(result => {
    return result.startTime && result.endTime && 
           new Date(result.startTime).getTime() <= new Date(result.endTime).getTime();
  });
  
  if (validResults.length === 0) return 0;

  const totalCompletionTime = validResults.reduce((sum, result) => {
    const startTime = new Date(result.startTime).getTime();
    const endTime = new Date(result.endTime).getTime();
    return sum + (endTime - startTime);
  }, 0);

  const averageCompletionTimeMs = totalCompletionTime / validResults.length;
  return averageCompletionTimeMs / (60 * 1000);
};

const calculateTopPerformers = (results: StudentExamSubmission[]): any[] => {
  const sortedResults = results.sort((a, b) => {
    const percentageA = (a.score / (a.totalMarks || 1)) * 100;
    const percentageB = (b.score / (b.totalMarks || 1)) * 100;
    
    return percentageB - percentageA;
  });
  
  return sortedResults.slice(0, 5).map(result => {
    const percentage = ((result.score / (result.totalMarks || 1)) * 100);
    
    return {
      studentName: result.studentName || 'Anonymous',
      score: result.score,
      totalMarks: result.totalMarks,
      percentage: typeof percentage === 'number' ? `${percentage.toFixed(1)}%` : `${percentage}%`
    };
  });
};

const calculateTimeDistribution = (results: StudentExamSubmission[]): any[] => {
  const timeRanges = [
    { min: 0, max: 10, range: '0-10 min' },
    { min: 11, max: 20, range: '11-20 min' },
    { min: 21, max: 30, range: '21-30 min' },
    { min: 31, max: 40, range: '31-40 min' },
    { min: 41, max: Number.MAX_SAFE_INTEGER, range: '41+ min' }
  ];

  const validResults = results.filter(result => {
    return result.startTime && result.endTime && 
           new Date(result.startTime).getTime() <= new Date(result.endTime).getTime();
  });

  const timeDistribution = timeRanges.map(range => {
    const count = validResults.filter(result => {
      const startTime = new Date(result.startTime).getTime();
      const endTime = new Date(result.endTime).getTime();
      const completionTimeMinutes = (endTime - startTime) / (60 * 1000);
      return completionTimeMinutes >= range.min && completionTimeMinutes <= range.max;
    }).length;

    return { name: range.range, count };
  });

  return timeDistribution;
};

const calculateScoreTrends = (results: StudentExamSubmission[]): any[] => {
  const studentScores: Record<string, { totalScore: number; count: number; maxScore?: number }> = {};
  
  results.forEach(result => {
    if (!result.studentName) return;

    const studentName = result.studentName;
    if (!studentScores[studentName]) {
      studentScores[studentName] = { totalScore: 0, count: 0, maxScore: result.totalMarks };
    }
    studentScores[studentName].totalScore += result.score;
    studentScores[studentName].count += 1;
    
    if (result.totalMarks) {
      studentScores[studentName].maxScore = result.totalMarks;
    }
  });
  
  const scoreTrends = Object.entries(studentScores)
    .map(([studentName, data]) => {
      const maxPossibleScore = data.maxScore || 100;
      const avgScoreRaw = data.count > 0 ? (data.totalScore / data.count) : 0;
      const avgScorePercentage = (avgScoreRaw / maxPossibleScore) * 100;
      
      return {
        name: studentName,
        avgScore: parseFloat(avgScorePercentage.toFixed(2))
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  
  return scoreTrends;
};

export function clearTemporaryAnswers(): void {
  // console.log("Local storage functions disabled as requested");
}

export function getTemporaryAnswers(examId: string): Record<string, string[]> {
  // console.log("Retrieving temporary answers for exam:", examId);
  return {};
}

export function saveTemporaryAnswers(examId: string, answers: Record<string, string[]>): void {
  // console.log("Temporary answers save requested for exam:", examId);
}

export const blobUrlToBase64 = async (blobUrl: string): Promise<string> => {
  try {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    // console.error('Error converting blob URL to base64:', error);
    throw new Error('Failed to convert image format');
  }
};

export const uploadQuestionImage = async (imageData: string): Promise<string> => {
  if (!imageData) return '';
  
  try {
    const filename = `question_images/${uuidv4()}.jpg`;
    
    let base64Data = imageData;
    
    if (imageData.startsWith('blob:')) {
      base64Data = await blobUrlToBase64(imageData);
    }
    
    const base64Content = base64Data.split(',')[1];
    
    const byteCharacters = atob(base64Content);
    const byteArrays = [];
    for (let i = 0; i < byteCharacters.length; i++) {
      byteArrays.push(byteCharacters.charCodeAt(i));
    }
    const uint8Array = new Uint8Array(byteArrays);
    
    const { data, error } = await supabase.storage
      .from('question_images')
      .upload(filename, uint8Array, {
        contentType: 'image/jpeg',
        upsert: true
      });
    
    if (error) {
      // console.error('Supabase Storage upload error:', error);
      throw error;
    }
    
    const { data: publicUrlData } = supabase.storage
      .from('question_images')
      .getPublicUrl(filename);
    
    return publicUrlData.publicUrl;
  } catch (error) {
    // console.error('Error uploading image:', error);
    throw new Error('Failed to upload image');
  }
};

export const getImagePublicUrl = (path: string): string => {
  if (!path || path.startsWith('data:') || path.startsWith('blob:')) return path;
  
  const { data } = supabase.storage
    .from('question_images')
    .getPublicUrl(path);
  
  return data.publicUrl;
};

export const isSupabaseStorageUrl = (url: string): boolean => {
  if (!url) return false;
  return url.includes('storage.googleapis.com') || 
         url.includes('.supabase.co/storage/v1') || 
         url.includes('.supabase.in/storage/v1');
};

// export const createQuestionImagesBucket = async (): Promise<void> => {
//   try {
//     // console.log('Creating questions bucket for image storage');
//     const { data, error } = await supabase.storage.getBucket('question_images');
    
//     if (error && error.message.includes('does not exist')) {
//       const { error: createError } = await supabase.storage.createBucket('question_images', {
//         public: true,
//         fileSizeLimit: 5242880,
//       });
      
//       if (createError) {
//         // console.error('Error creating bucket:', createError);
//       }
//     }
//   } catch (error) {
//     // console.error('Error setting up storage bucket:', error);
//   }
// };

// createQuestionImagesBucket();
