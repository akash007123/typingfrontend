import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Clock, Zap, Target, RotateCcw } from 'lucide-react';
import { calculateWPM, calculateCPM, calculateAccuracy, analyzeTyping } from '../utils/typingUtils';
import { useDeviceType, MobileButton, MobileTypingArea, MobileCard } from './MobileOptimizations';

interface LocationState {
  text: string;
  source: 'pasted' | 'uploaded';
  filename?: string;
  title?: string;
}

export function TypingTest() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;
  const deviceType = useDeviceType();
  
  const [currentText] = useState(state?.text || '');
  const [typedText, setTypedText] = useState('');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [cpm, setCpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [showSubmitButton, setShowSubmitButton] = useState(false);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!state?.text) {
      navigate('/');
      return;
    }
    
    // Focus on input when component mounts
    inputRef.current?.focus();
  }, [state, navigate]);

  useEffect(() => {
    // Start timer when user begins typing
    if (typedText.length === 1 && !startTime) {
      setStartTime(new Date());
      startTimer();
    }
    
    // Show submit button when user has typed substantial amount
    if (typedText.length > currentText.length * 0.8) {
      setShowSubmitButton(true);
    }
    
    // Update real-time stats
    if (startTime && typedText.length > 0) {
      const timeElapsed = (Date.now() - startTime.getTime()) / 1000;
      const correctChars = calculateCorrectChars();
      
      setWpm(calculateWPM(correctChars, timeElapsed));
      setCpm(calculateCPM(correctChars, timeElapsed));
      setAccuracy(calculateAccuracy(correctChars, typedText.length));
    }
    
    // Check if test is completed
    if (typedText.length >= currentText.length) {
      setIsCompleted(true);
      setShowSubmitButton(true);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [typedText, startTime, currentText]);

  const calculateCorrectChars = () => {
    let correct = 0;
    const minLength = Math.min(typedText.length, currentText.length);
    
    for (let i = 0; i < minLength; i++) {
      if (typedText[i] === currentText[i]) {
        correct++;
      }
    }
    
    return correct;
  };

  const startTimer = () => {
    intervalRef.current = window.setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
  };

  const handleSubmitTest = async () => {
    if (!startTime) return;
    
    const endTime = new Date();
    const finalTime = (endTime.getTime() - startTime.getTime()) / 1000;
    const analysis = analyzeTyping(currentText, typedText, finalTime);
    
    // Navigate to results first
    navigate('/results', {
      state: {
        originalText: currentText,
        typedText,
        totalTime: finalTime,
        analysis,
        source: state.source,
        filename: state.filename,
        title: state.title
      }
    });
  };

  const handleRestart = () => {
    setTypedText('');
    setStartTime(null);
    setElapsedTime(0);
    setWpm(0);
    setCpm(0);
    setAccuracy(100);
    setIsCompleted(false);
    setShowSubmitButton(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    inputRef.current?.focus();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!state?.text) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-4 md:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">Typing Test</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {state.title || 'Typing Practice'}
          </p>
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-500">
            Text length: {currentText.length} characters • {currentText.split(' ').length} words
          </div>
        </div>

        {/* Stats Bar */}
        <MobileCard className="mb-6 md:mb-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-4 w-4 md:h-5 md:w-5 text-blue-600 mr-1 md:mr-2" />
                <span className="font-semibold text-gray-700 dark:text-gray-300 text-sm md:text-base">Time</span>
              </div>
              <div className="text-xl md:text-2xl font-bold text-blue-600">
                {formatTime(elapsedTime)}
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Zap className="h-4 w-4 md:h-5 md:w-5 text-green-600 mr-1 md:mr-2" />
                <span className="font-semibold text-gray-700 dark:text-gray-300 text-sm md:text-base">WPM</span>
              </div>
              <div className="text-xl md:text-2xl font-bold text-green-600">
                {wpm}
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Zap className="h-4 w-4 md:h-5 md:w-5 text-purple-600 mr-1 md:mr-2" />
                <span className="font-semibold text-gray-700 dark:text-gray-300 text-sm md:text-base">CPM</span>
              </div>
              <div className="text-xl md:text-2xl font-bold text-purple-600">
                {cpm}
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Target className="h-4 w-4 md:h-5 md:w-5 text-indigo-600 mr-1 md:mr-2" />
                <span className="font-semibold text-gray-700 dark:text-gray-300 text-sm md:text-base">Accuracy</span>
              </div>
              <div className="text-xl md:text-2xl font-bold text-indigo-600">
                {accuracy}%
              </div>
            </div>
            
            <div className="text-center md:col-span-1">
              <div className="flex items-center justify-center mb-2">
                <span className="font-semibold text-gray-700 dark:text-gray-300 text-sm md:text-base">Progress</span>
              </div>
              <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round((typedText.length / currentText.length) * 100)}%
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4 md:mt-6">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(typedText.length / currentText.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </MobileCard>

        {/* Typing Area */}
        <MobileCard className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Type the text from memory</h2>
            <div className="flex flex-col sm:flex-row gap-2">
              {showSubmitButton && (
                <MobileButton
                  onClick={handleSubmitTest}
                  variant="primary"
                  size={deviceType === 'mobile' ? 'lg' : 'md'}
                >
                  Submit Test
                </MobileButton>
              )}
              <MobileButton
                onClick={handleRestart}
                variant="secondary"
                size={deviceType === 'mobile' ? 'lg' : 'md'}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Restart
              </MobileButton>
            </div>
          </div>
          
          <MobileTypingArea
            value={typedText}
            onChange={(value) => {
              setTypedText(value);
              
              // Start timer when user begins typing
              if (value.length === 1 && !startTime) {
                setStartTime(new Date());
                startTimer();
              }
              
              // Show submit button when user has typed substantial amount
              if (value.length > currentText.length * 0.8) {
                setShowSubmitButton(true);
              }
              
              // Update real-time stats
              if (startTime) {
                const currentTime = new Date();
                const elapsedSeconds = (currentTime.getTime() - startTime.getTime()) / 1000;
                const correctChars = calculateCorrectChars();
                const currentWpm = calculateWPM(correctChars, elapsedSeconds);
                const currentCpm = calculateCPM(correctChars, elapsedSeconds);
                const currentAccuracy = calculateAccuracy(correctChars, value.length);
                
                setWpm(currentWpm);
                setCpm(currentCpm);
                setAccuracy(currentAccuracy);
              }
              
              // Check if test is completed
              if (value.length >= currentText.length) {
                setIsCompleted(true);
                setShowSubmitButton(true);
                if (intervalRef.current) {
                  clearInterval(intervalRef.current);
                }
              }
            }}
            placeholder="Start typing the text from memory. The original text is hidden to test your recall..."
            disabled={isCompleted}
            rows={deviceType === 'mobile' ? 8 : 12}
            className="font-mono text-base md:text-lg leading-relaxed"
          />
          
          <div className="mt-4 flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
            <div>
              <p>Characters typed: {typedText.length} / {currentText.length}</p>
            </div>
            <div>
              <p>
                Press <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Tab</kbd> to focus • 
                Type at least 80% to submit
              </p>
            </div>
          </div>
        </MobileCard>

        {/* Instructions */}
        <MobileCard className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-3">Instructions</h3>
          <ul className="space-y-2 text-blue-800 dark:text-blue-300 text-sm md:text-base">
            <li>• The original text is hidden to test your memory and recall</li>
            <li>• Focus on accuracy and try to remember the exact wording</li>
            <li>• Type at least 80% of the text to enable the submit button</li>
            <li>• Click "Submit Test" when you're ready to see your results</li>
            <li>• Your typing will be analyzed for speed, accuracy, and improvement suggestions</li>
          </ul>
        </MobileCard>
      </div>
    </div>
  );
}