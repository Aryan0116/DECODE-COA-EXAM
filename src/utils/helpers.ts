export const downloadQuestionCsvTemplate = () => {
    // CSV header row
    const headers = [
      'questionText',
      'option1',
      'option2',
      'option3',
      'option4',
      'correctAnswers',
      'marks',
      'chapterName',
      'coNumber'
    ].join(',');
  
    // Sample data rows
    const rows = [
      '"What is the primary function of the ALU in a CPU?","Decoding instructions","Executing arithmetic and logical operations","Storing data temporarily","Fetching instructions","o2",2,"Central Processing Unit","CO4"',
      '"Which of the following are types of computer memory? (Select all that apply)","RAM","ROM","Cache","BIOS","o1,o2,o3",3,"Memory Organisation","CO5"',
      '"What is the purpose of the Control Unit in a CPU?","Performing mathematical operations","Managing input/output operations","Coordinating the activities of CPU components","Permanently storing the BIOS","o3",1,"Central Processing Unit","CO4"'
    ];
  
    // Combine headers and rows
    const csvContent = [headers, ...rows].join('\n');
    
    // Create a Blob with the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'question_template.csv');
    
    // Append the link to the document
    document.body.appendChild(link);
    
    // Trigger the download
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };