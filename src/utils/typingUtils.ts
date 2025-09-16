import { TypingStats, MistakeDetail } from '../types';

export function calculateWPM(correctChars: number, timeInSeconds: number): number {
  if (timeInSeconds === 0) return 0;
  const minutes = timeInSeconds / 60;
  const words = correctChars / 5; // Standard: 5 characters = 1 word
  return Math.round(words / minutes);
}

export function calculateCPM(correctChars: number, timeInSeconds: number): number {
  if (timeInSeconds === 0) return 0;
  const minutes = timeInSeconds / 60;
  return Math.round(correctChars / minutes);
}

export function calculateExpectedTime(text: string, averageWpm: number = 40): number {
  const wordCount = text.split(' ').length;
  return Math.round((wordCount / averageWpm) * 60); // in seconds
}
export function calculateAccuracy(correctChars: number, totalTyped: number): number {
  if (totalTyped === 0) return 100;
  return Math.round((correctChars / totalTyped) * 100);
}

export function analyzeTyping(
  originalText: string,
  typedText: string,
  timeInSeconds: number
): TypingStats & { mistakeDetails: MistakeDetail[]; improvementSuggestions: string[] } {
  let correctChars = 0;
  let mistakes = 0;
  const mistakeDetails: MistakeDetail[] = [];
  
  const words = originalText.split(' ');
  const typedWords = typedText.split(' ');
  
  for (let i = 0; i < Math.min(originalText.length, typedText.length); i++) {
    if (originalText[i] === typedText[i]) {
      correctChars++;
    } else {
      mistakes++;
      
      // Find word context for mistake
      let wordIndex = 0;
      let charIndex = 0;
      for (let j = 0; j < words.length; j++) {
        const wordEnd = charIndex + words[j].length;
        if (i >= charIndex && i <= wordEnd) {
          wordIndex = j;
          break;
        }
        charIndex = wordEnd + 1; // +1 for space
      }
      
      mistakeDetails.push({
        position: i,
        expected: originalText[i],
        typed: typedText[i],
        word: words[wordIndex] || '',
        wordIndex
      });
    }
  }
  
  const totalChars = typedText.length;
  const wpm = calculateWPM(correctChars, timeInSeconds);
  const cpm = calculateCPM(correctChars, timeInSeconds);
  const accuracy = calculateAccuracy(correctChars, totalChars);
  const expectedTime = calculateExpectedTime(originalText);
  const improvementSuggestions = generateImprovementSuggestions(mistakeDetails, accuracy, wpm);
  
  return {
    wpm,
    cpm,
    accuracy,
    elapsedTime: timeInSeconds,
    correctChars,
    totalChars,
    mistakes: mistakeDetails.length,
    mistakeDetails,
    expectedTime,
    improvementSuggestions
  };
}

export function generateImprovementSuggestions(
  mistakes: MistakeDetail[],
  accuracy: number,
  wpm: number
): string[] {
  const suggestions: string[] = [];
  
  // Accuracy-based suggestions
  if (accuracy < 80) {
    suggestions.push("Focus on accuracy over speed. Slow down and ensure each keystroke is correct.");
  } else if (accuracy < 90) {
    suggestions.push("Good progress! Try to maintain focus on accuracy while gradually increasing speed.");
  }
  
  // Speed-based suggestions
  if (wpm < 30) {
    suggestions.push("Practice basic finger positioning and try to type without looking at the keyboard.");
  } else if (wpm < 50) {
    suggestions.push("Great foundation! Focus on building muscle memory for common letter combinations.");
  } else if (wpm >= 70) {
    suggestions.push("Excellent typing speed! Consider practicing complex texts to maintain this level.");
  }
  
  // Mistake pattern analysis
  const punctuationMistakes = mistakes.filter(m => /[.,;:!?'"()-]/.test(m.expected));
  const numberMistakes = mistakes.filter(m => /[0-9]/.test(m.expected));
  const capitalMistakes = mistakes.filter(m => m.expected !== m.expected.toLowerCase() && m.expected !== m.typed);
  
  if (punctuationMistakes.length > mistakes.length * 0.3) {
    suggestions.push("Focus on punctuation accuracy. Practice typing sentences with various punctuation marks.");
  }
  
  if (numberMistakes.length > 0) {
    suggestions.push("Practice typing numbers. Consider using the number row or numeric keypad more frequently.");
  }
  
  if (capitalMistakes.length > mistakes.length * 0.2) {
    suggestions.push("Work on capitalization accuracy. Practice proper use of the Shift key.");
  }
  
  // Common mistake words
  const mistakeWords = new Map<string, number>();
  mistakes.forEach(mistake => {
    const word = mistake.word.toLowerCase();
    mistakeWords.set(word, (mistakeWords.get(word) || 0) + 1);
  });
  
  const frequentMistakeWords = Array.from(mistakeWords.entries())
    .filter(([_, count]) => count >= 2)
    .map(([word, _]) => word);
  
  if (frequentMistakeWords.length > 0) {
    suggestions.push(`Practice these challenging words: ${frequentMistakeWords.slice(0, 3).join(', ')}`);
  }
  
  if (suggestions.length === 0) {
    suggestions.push("Excellent performance! Keep practicing to maintain your skills.");
  }
  
  return suggestions;
}
export function extractTextFromFile(file: File): Promise<string> {
  return new Promise(async (resolve, reject) => {
    if (file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string || '');
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    } else if (file.type === 'application/pdf') {
      try {
        // Try simplified PDF extraction first
        const text = await extractTextFromPDFSimple(file);
        resolve(text);
      } catch (error) {
        console.error('Simple PDF extraction failed, trying advanced method:', error);
        try {
          const text = await extractTextFromPDF(file);
          resolve(text);
        } catch (advancedError) {
          reject(new Error('Failed to extract text from PDF. This PDF may be image-based, password-protected, or use unsupported encoding. Please try converting it to a text file or copy-paste the content directly.'));
        }
      }
    } else {
      reject(new Error('Unsupported file type. Please use .txt files or paste content directly.'));
    }
  });
}

// Simplified PDF extraction method
async function extractTextFromPDFSimple(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  
  // Use a simple worker configuration
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.4.149/build/pdf.worker.min.js';
  
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item: any) => item.str).join(' ');
    text += pageText + '\n';
  }
  
  if (!text.trim()) {
    throw new Error('No text found in PDF');
  }
  
  return text.trim();
}

async function extractTextFromPDF(file: File): Promise<string> {
  try {
    console.log('Starting PDF extraction for file:', file.name, 'Size:', file.size);
    
    // Import pdfjs-dist dynamically
    const pdfjsLib = await import('pdfjs-dist');
    
    // Try to use a local worker first, fallback to CDN
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.js',
        import.meta.url
      ).toString();
    } catch {
      // Fallback to CDN with exact version match
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.4.149/build/pdf.worker.min.js';
    }
    
    const arrayBuffer = await file.arrayBuffer();
    console.log('File converted to ArrayBuffer, size:', arrayBuffer.byteLength);
    
    // More robust PDF loading configuration
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useSystemFonts: true,
      disableFontFace: false,
      verbosity: 0,
    });
    
    console.log('Loading PDF document...');
    const pdf = await loadingTask.promise;
    console.log('PDF loaded successfully. Pages:', pdf.numPages);
    
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        console.log(`Processing page ${i}...`);
        
        // Better text extraction with proper spacing
        const pageText = textContent.items
          .map((item: any) => {
            if (item.str && typeof item.str === 'string') {
              return item.str;
            }
            return '';
          })
          .filter(text => text.trim().length > 0)
          .join(' ');
          
        console.log(`Page ${i} extracted text length:`, pageText.length);
        
        if (pageText.trim()) {
          fullText += pageText + '\n';
        }
      } catch (pageError) {
        console.warn(`Failed to extract text from page ${i}:`, pageError);
        continue;
      }
    }
    
    const cleanedText = fullText.trim();
    console.log('Total extracted text length:', cleanedText.length);
    
    if (!cleanedText) {
      console.error('No text extracted from PDF');
      throw new Error('No readable text found in PDF. The PDF might be image-based or encrypted.');
    }
    
    console.log('PDF extraction successful');
    return cleanedText;
  } catch (error) {
    console.error('PDF extraction error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('No readable text found')) {
        throw error;
      }
      if (error.message.includes('Invalid PDF')) {
        throw new Error('Invalid PDF file. Please ensure the file is not corrupted.');
      }
      if (error.message.includes('password')) {
        throw new Error('Password-protected PDFs are not supported. Please use an unprotected PDF.');
      }
    }
    
    throw new Error('Failed to extract text from PDF. Please ensure the PDF contains selectable text and is not image-based.');
  }
}
export function generatePDFReport(testData: {
  wpm: number;
  cpm: number;
  accuracy: number;
  totalTime: number;
  expectedTime: number;
  mistakes: number;
  mistakeDetails: MistakeDetail[];
  improvementSuggestions: string[];
  text: string;
  completedAt: Date;
}): void {
  const reportContent = `
TYPING TEST REPORT
==================

Date: ${testData.completedAt.toLocaleDateString()}
Time: ${testData.completedAt.toLocaleTimeString()}

RESULTS:
--------
Words Per Minute: ${testData.wpm} WPM
Characters Per Minute: ${testData.cpm} CPM
Accuracy: ${testData.accuracy}%
Total Time: ${Math.floor(testData.totalTime / 60)}:${(testData.totalTime % 60).toString().padStart(2, '0')}
Expected Time: ${Math.floor(testData.expectedTime / 60)}:${(testData.expectedTime % 60).toString().padStart(2, '0')}
Time Efficiency: ${testData.expectedTime > 0 ? Math.round((testData.expectedTime / testData.totalTime) * 100) : 100}%
Mistakes: ${testData.mistakes}

IMPROVEMENT SUGGESTIONS:
------------------------
${testData.improvementSuggestions.map(suggestion => `• ${suggestion}`).join('\n')}

MISTAKE ANALYSIS:
-----------------
${testData.mistakeDetails.length > 0 
  ? testData.mistakeDetails.map(mistake => 
      `Position ${mistake.position}: Expected "${mistake.expected}", Typed "${mistake.typed}" (in word "${mistake.word}")`
    ).join('\n')
  : 'No mistakes found!'
}

TEXT USED:
----------
${testData.text}
  `;

  const blob = new Blob([reportContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `typing-test-report-${testData.completedAt.toISOString().split('T')[0]}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface TextDiff {
  type: 'correct' | 'incorrect' | 'missing' | 'extra';
  char: string;
  position: number;
}

export function compareTexts(originalText: string, typedText: string): TextDiff[] {
  const diffs: TextDiff[] = [];
  const maxLength = Math.max(originalText.length, typedText.length);
  
  for (let i = 0; i < maxLength; i++) {
    const originalChar = originalText[i] || '';
    const typedChar = typedText[i] || '';
    
    if (i >= originalText.length) {
      // Extra characters typed beyond original text
      diffs.push({
        type: 'extra',
        char: typedChar,
        position: i
      });
    } else if (i >= typedText.length) {
      // Missing characters (not typed yet)
      diffs.push({
        type: 'missing',
        char: originalChar,
        position: i
      });
    } else if (originalChar === typedChar) {
      // Correct character
      diffs.push({
        type: 'correct',
        char: originalChar,
        position: i
      });
    } else {
      // Incorrect character
      diffs.push({
        type: 'incorrect',
        char: originalChar,
        position: i
      });
    }
  }
  
  return diffs;
}

export function getHighlightClasses(type: TextDiff['type']): string {
  const classes = {
    correct: 'text-green-700 bg-green-100',
    incorrect: 'text-red-700 bg-red-200',
    missing: 'text-gray-500 bg-yellow-100',
    extra: 'text-purple-700 bg-purple-100'
  };
  return classes[type];
}


export function formatDateTime(date: Date): string {
  const formattedDate = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return `${formattedDate} ${formattedTime}`;
}