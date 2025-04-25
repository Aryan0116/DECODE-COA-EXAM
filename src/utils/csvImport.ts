import Papa from 'papaparse';
export const getCSVTemplate = () => {
    return `text,options,correct_answer,subject,chapter,co,image
  "What is 2+2?","[""2"",""3"",""4"",""5""]","4","Math","Arithmetic","CO1",""
  "What is the capital of France?","[""London"",""Paris"",""Berlin"",""Madrid""]","Paris","Geography","Europe","CO2",""`;
  };
  
export const parseCSV = (csvContent: string) => {
    try {
      const { data, errors } = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
      });
  
      if (errors.length > 0) {
        // console.error('CSV parsing errors:', errors);
        throw new Error('Error parsing CSV file');
      }
  
      return data.map((row) => {
        // Parse options from string to array
        const options = typeof row.options === 'string' ? 
          JSON.parse(row.options.replace(/'/g, '"')) : 
          [];
          
        // Convert options array to the required format
        const formattedOptions = options.map((text, index) => ({
          id: `o${index + 1}`,
          text: text
        }));
        
        // Create Question object
        return {
          id: `q${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text: row.text,
          options: formattedOptions,
          correctAnswers: [formattedOptions.find(o => o.text === row.correct_answer)?.id].filter(Boolean),
          marks: parseInt(row.difficulty_level === 'easy' ? '1' : row.difficulty_level === 'medium' ? '2' : '3'),
          chapterName: row.chapter,
          coNumber: row.co,
        };
      });
    } catch (error) {
      // console.error('Error parsing CSV:', error);
      throw error;
    }
  };