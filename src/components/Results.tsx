import React, { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Clock, Target, Zap, Home, RotateCcw, Trophy, AlertTriangle, Download } from 'lucide-react';
import { generatePDFReport, compareTexts, getHighlightClasses, TextDiff } from '../utils/typingUtils';
import { MistakeDetail, TypingTest } from '../types';
import { useAuth } from '../hooks/useAuth';
import { testService } from '../services/testService';
import { formatDateTime } from '../utils/typingUtils'

interface LocationState {
  originalText: string;
  typedText: string;
  analysis: {
    wpm: number;
    cpm: number;
    accuracy: number;
    elapsedTime: number;
    correctChars: number;
    totalChars: number;
    mistakes: number;
    mistakeDetails: MistakeDetail[];
    expectedTime: number;
    improvementSuggestions: string[];
  };
  source: 'pasted' | 'uploaded';
  filename?: string;
  title?: string;
  totalTime: number;
}

export function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const state = location.state as LocationState;

  useEffect(() => {
    if (!state) {
      navigate('/');
      return;
    }

    // Submit test result to backend if user is logged in
    const submitResult = async () => {
      if (user && state.analysis) {
        try {
          // First, get a random test from backend to get a valid testId
          const randomTest = await testService.getRandomTest();
          const testId = randomTest.test?.id || 'custom-test';

          // Submit the result to backend
          await testService.submitTestResult({
            testId,
            wpm: state.analysis.wpm,
            accuracy: state.analysis.accuracy,
            duration: state.totalTime,
            wordsTyped: Math.floor(state.analysis.correctChars / 5), // Approximate words
            charactersTyped: state.analysis.totalChars,
            correctCharacters: state.analysis.correctChars,
            incorrectCharacters: state.analysis.totalChars - state.analysis.correctChars,
            errors: state.analysis.mistakeDetails,
            keystrokes: [],
            startTime: new Date(Date.now() - state.totalTime * 1000),
            endTime: new Date()
          });

          console.log('Test result submitted successfully');
        } catch (error) {
          console.error('Failed to submit test result:', error);
          
          // Fallback to localStorage if API fails
          const testData: TypingTest = {
            id: `test-${Date.now()}`,
            userId: user.id,
            text: state.originalText,
            title: state.title || 'Untitled',
            textSource: state.source,
            filename: state.filename,
            wpm: state.analysis.wpm,
            cpm: state.analysis.cpm,
            accuracy: state.analysis.accuracy,
            totalTime: state.totalTime,
            expectedTime: state.analysis.expectedTime,
            mistakes: state.analysis.mistakes,
            mistakeDetails: state.analysis.mistakeDetails,
            improvementSuggestions: state.analysis.improvementSuggestions,
            completedAt: new Date()
          };

          testService.saveTest(testData);
        }
      }
    };

    submitResult();
  }, [state, user, navigate]);

  if (!state) {
    return null;
  }

  const { analysis, originalText, typedText } = state;

  const handleRetry = () => {
    navigate('/test', {
      state: {
        text: originalText,
        source: state.source,
        filename: state.filename,
        title: state.title
      }
    });
  };

  const handleDownloadReport = () => {
    generatePDFReport({
      wpm: analysis.wpm,
      cpm: analysis.cpm,
      accuracy: analysis.accuracy,
      totalTime: state.totalTime,
      expectedTime: analysis.expectedTime,
      mistakes: analysis.mistakes,
      mistakeDetails: analysis.mistakeDetails,
      improvementSuggestions: analysis.improvementSuggestions,
      text: originalText,
      completedAt: new Date()
    });
  };

  const getPerformanceLevel = (wpm: number, accuracy: number) => {
    if (wpm >= 70 && accuracy >= 95) return { level: 'Excellent', color: 'text-green-600', bg: 'bg-green-100' };
    if (wpm >= 50 && accuracy >= 90) return { level: 'Good', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (wpm >= 30 && accuracy >= 80) return { level: 'Average', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { level: 'Needs Practice', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const performance = getPerformanceLevel(analysis.wpm, analysis.accuracy);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateDetailedStats = () => {
    const totalWords = originalText.trim().split(/\s+/).length;
    const typedWords = typedText.trim().split(/\s+/).length;
    const totalKeystrokes = analysis.totalChars;
    const mistakePercentage = totalWords > 0 ? ((analysis.mistakes / totalWords) * 100).toFixed(2) : '0.00';
    
    // Categorize mistakes
    let fullMistakes = 0;
    let halfMistakes = 0;
    let punctuationMistakes = 0;
    let additions = 0;
    let omissions = 0;
    let spellingMistakes = 0;
    let capitalizationMistakes = 0;
    
    analysis.mistakeDetails.forEach((mistake: MistakeDetail) => {
      const expected = mistake.expected.toLowerCase();
      const typed = mistake.typed.toLowerCase();
      
      // Punctuation mistakes
      if (/[.,;:!?"'()\[\]{}]/.test(mistake.expected) || /[.,;:!?"'()\[\]{}]/.test(mistake.typed)) {
        punctuationMistakes++;
      }
      // Capitalization mistakes
      else if (expected === typed && mistake.expected !== mistake.typed) {
        capitalizationMistakes++;
        halfMistakes++;
      }
      // Full character replacement
      else if (mistake.expected !== '' && mistake.typed !== '' && expected !== typed) {
        fullMistakes++;
        spellingMistakes++;
      }
      // Additions (extra characters)
      else if (mistake.expected === '' && mistake.typed !== '') {
        additions++;
        halfMistakes++;
      }
      // Omissions (missing characters)
      else if (mistake.expected !== '' && mistake.typed === '') {
        omissions++;
        halfMistakes++;
      }
    });
    
    return {
      totalWords,
      typedWords,
      totalKeystrokes,
      mistakePercentage,
      fullMistakes,
      halfMistakes,
      punctuationMistakes,
      additions,
      omissions,
      spellingMistakes,
      capitalizationMistakes
    };
  };
  
  const detailedStats = calculateDetailedStats();
  const testDate = new Date();
  
  const renderMistakeAnalysis = () => {
    const mistakeWords = new Map<string, number>();
    state.analysis.mistakeDetails.forEach((mistake: MistakeDetail) => {
      const word = mistake.word;
      mistakeWords.set(word, (mistakeWords.get(word) || 0) + 1);
    });

    const topMistakes = Array.from(mistakeWords.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return (
      <div className="space-y-4">
        {topMistakes.length > 0 ? (
          <>
            <h4 className="font-medium text-gray-900">Most Problematic Words:</h4>
            <div className="space-y-2">
              {topMistakes.map(([word, count], index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-red-50 rounded">
                  <span className="font-mono text-red-800">"{word}"</span>
                  <span className="text-red-600 text-sm">{count} mistake{count > 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <Trophy className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-green-600 font-medium">Perfect! No mistakes found!</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Trophy className="h-12 w-12 text-yellow-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Complete!</h1>
          <div className={`inline-flex items-center px-4 py-2 rounded-full ${performance.bg}`}>
            <span className={`font-semibold ${performance.color}`}>{performance.level}</span>
          </div>
          
          {/* Test Info Header */}
          <div className="mt-6 bg-slate-800 text-white rounded-lg p-4 max-w-2xl mx-auto">
            <h2 className="text-lg font-semibold">Dictation Name: {state.title || (state.source === 'uploaded' ? state.filename : 'Custom Text')}</h2>
          </div>
        </div>

        {/* Comprehensive Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {/* Row 1 */}
          <div className="bg-slate-700 text-white rounded-lg p-4 text-center">
            <div className="text-xl font-bold">{detailedStats.totalWords}</div>
            <div className="text-sm opacity-90">Total words</div>
          </div>
          
          <div className="bg-slate-700 text-white rounded-lg p-4 text-center">
            <div className="text-xl font-bold">{detailedStats.typedWords}</div>
            <div className="text-sm opacity-90">Typed Words</div>
          </div>
          
          <div className="bg-red-600 text-white rounded-lg p-4 text-center">
            <div className="text-xl font-bold">{detailedStats.fullMistakes}</div>
            <div className="text-sm opacity-90">Total No. of Full Mistakes</div>
          </div>
          
          {/* Row 2 */}
          <div className="bg-orange-500 text-white rounded-lg p-4 text-center">
            <div className="text-xl font-bold">{detailedStats.halfMistakes}</div>
            <div className="text-sm opacity-90">Total No. of Half Mistakes</div>
          </div>
          
          <div className="bg-blue-600 text-white rounded-lg p-4 text-center">
            <div className="text-xl font-bold">{detailedStats.punctuationMistakes}</div>
            <div className="text-sm opacity-90">Punctuation Mistakes</div>
          </div>
          
          <div className="bg-slate-700 text-white rounded-lg p-4 text-center">
            <div className="text-xl font-bold">{detailedStats.mistakePercentage}%</div>
            <div className="text-sm opacity-90">Total % of Mistakes</div>
          </div>
          
          {/* Row 3 */}
          <div className="bg-red-700 text-white rounded-lg p-4 text-center">
            <div className="text-xl font-bold">{analysis.accuracy}%</div>
            <div className="text-sm opacity-90">Accuracy</div>
          </div>
          
          <div className="bg-slate-700 text-white rounded-lg p-4 text-center">
            <div className="text-xl font-bold">{detailedStats.totalKeystrokes}</div>
            <div className="text-sm opacity-90">Typed Keystrokes</div>
          </div>
          
          <div className="bg-slate-700 text-white rounded-lg p-4 text-center">
            <div className="text-xl font-bold">{analysis.wpm} WPM</div>
            <div className="text-sm opacity-90">Typing Speed</div>
          </div>
          
          {/* Test Date and Time */}
          <div className="bg-slate-800 text-white rounded-lg p-4 text-center col-span-2 md:col-span-3">
            <div className="text-lg font-bold">
              Test Date: {formatDateTime(testDate)}
            </div>
            <div className="text-sm opacity-90">Completed on</div>
          </div>
        </div>
        
        {/* Mistake Categories */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-red-100 border border-red-300 rounded-lg p-3 text-center">
            <div className="w-4 h-4 bg-red-500 rounded-full mx-auto mb-2"></div>
            <div className="text-sm font-medium text-red-800">Additions</div>
            <div className="text-xs text-red-600">{detailedStats.additions} errors</div>
          </div>
          
          <div className="bg-green-100 border border-green-300 rounded-lg p-3 text-center">
            <div className="w-4 h-4 bg-green-500 rounded-full mx-auto mb-2"></div>
            <div className="text-sm font-medium text-green-800">Omissions</div>
            <div className="text-xs text-green-600">{detailedStats.omissions} errors</div>
          </div>
          
          <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 text-center">
            <div className="w-4 h-4 bg-yellow-500 rounded-full mx-auto mb-2"></div>
            <div className="text-sm font-medium text-yellow-800">Spelling Mistakes</div>
            <div className="text-xs text-yellow-600">{detailedStats.spellingMistakes} errors</div>
          </div>
          
          <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 text-center">
            <div className="w-4 h-4 bg-blue-500 rounded-full mx-auto mb-2"></div>
            <div className="text-sm font-medium text-blue-800">Capitalization Mistakes</div>
            <div className="text-xs text-blue-600">{detailedStats.capitalizationMistakes} errors</div>
          </div>
          
          <div className="bg-purple-100 border border-purple-300 rounded-lg p-3 text-center">
            <div className="w-4 h-4 bg-purple-500 rounded-full mx-auto mb-2"></div>
            <div className="text-sm font-medium text-purple-800">Punctuation Mistakes</div>
            <div className="text-xs text-purple-600">{detailedStats.punctuationMistakes} errors</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Detailed Analysis */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Performance Analysis</h2>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Typing Speed</span>
                  <span>{analysis.wpm} WPM</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((analysis.wpm / 100) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Accuracy</span>
                  <span>{analysis.accuracy}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${analysis.accuracy}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Time Efficiency</span>
                  <span>{analysis.expectedTime > 0 ? Math.round((analysis.expectedTime / state.totalTime) * 100) : 100}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(analysis.expectedTime > 0 ? (analysis.expectedTime / state.totalTime) * 100 : 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="space-y-2 text-sm">
                  <div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expected Time:</span>
                      <span className="font-semibold">{formatTime(analysis.expectedTime)}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Actual Time:</span>
                      <span className="font-semibold">{formatTime(state.totalTime)}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Correct Characters:</span>
                      <span className="font-semibold text-green-600">{analysis.correctChars}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Typed:</span>
                      <span className="font-semibold text-gray-900">{analysis.totalChars}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mistake Analysis */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Mistake Analysis</h2>
            {renderMistakeAnalysis()}
          </div>

          {/* Improvement Suggestions */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Improvement Suggestions</h2>
            <div className="space-y-3">
              {analysis.improvementSuggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">{index + 1}</span>
                  </div>
                  <p className="text-blue-800 text-sm">{suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button
            onClick={handleRetry}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Try Again</span>
          </button>

          <button
            onClick={handleDownloadReport}
            className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Download Report</span>
          </button>

          <Link
            to="/"
            className="flex items-center space-x-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
          >
            <Home className="h-4 w-4" />
            <span>New Test</span>
          </Link>
        </div>

        {/* Text Comparison with Highlighting */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Text Comparison</h3>
          
          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded text-green-700 bg-green-100">Correct</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded text-red-700 bg-red-200">Incorrect</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded text-gray-500 bg-yellow-100">Missing</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded text-purple-700 bg-purple-100">Extra</span>
            </div>
          </div>
          
          {/* Highlighted Text Comparison */}
          <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm leading-relaxed h-48 overflow-y-auto">
            <h4 className="font-medium text-gray-700 mb-3 font-sans">Highlighted Original Text:</h4>
            <div className="whitespace-pre-wrap">
              {(() => {
                const diffs = compareTexts(originalText, typedText);
                return diffs.map((diff, index) => (
                  <span
                    key={index}
                    className={`${getHighlightClasses(diff.type)} ${diff.char === ' ' ? 'inline-block min-w-[8px]' : ''} rounded px-0.5`}
                    title={`${diff.type}: "${diff.char === ' ' ? 'space' : diff.char}"`}
                  >
                    {diff.char === ' ' ? '·' : diff.char}
                  </span>
                ));
              })()}
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Original Text:</h4>
              <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm text-gray-700 h-32 overflow-y-auto">
                {originalText}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Your Input:</h4>
              <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm text-gray-700 h-32 overflow-y-auto">
                {typedText}
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm text-gray-700">
            {originalText.substring(0, 200)}
            {originalText.length > 200 && '...'}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Source: {state.title || (state.source === 'uploaded' ? state.filename : 'Custom Text')}
          </div>
        </div>
      </div>
    </div>
  );
}