import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Type, FileText, Zap, Target, Clock } from 'lucide-react';
import { extractTextFromFile } from '../utils/typingUtils';
import { LoadingSpinner } from './LoadingSpinner';

export function HomePage() {
  const [textInput, setTextInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [textTitle, setTextTitle] = useState('');
  const navigate = useNavigate();

  const sampleTexts = [
    "The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet and is perfect for typing practice.",
    "Technology has revolutionized the way we communicate, work, and live. From smartphones to artificial intelligence, innovation continues to shape our future.",
    "Practice makes perfect. Regular typing exercises improve both speed and accuracy. Focus on proper finger placement and maintain a steady rhythm."
  ];

  const handleTextSubmit = () => {
    if (!textInput.trim()) {
      setError('Please enter some text or upload a file');
      return;
    }
    
    setError('');
    navigate('/test', { 
      state: { 
        text: textInput, 
        source: 'pasted',
        title: textTitle || 'Custom Text'
      } 
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError('');

    try {
      const extractedText = await extractTextFromFile(file);
      if (extractedText.trim()) {
        navigate('/test', { 
          state: { 
            text: extractedText, 
            source: 'uploaded',
            filename: file.name,
            title: file.name
          } 
        });
      } else {
        setError('The file appears to be empty');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSampleText = (text: string) => {
    setTextInput(text);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Master Your
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                {' '}Typing Skills
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Improve your typing speed and accuracy with our advanced typing test platform. 
              Track your progress, analyze mistakes, and reach new levels of productivity.
            </p>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Real-time Analysis</h3>
                <p className="text-gray-600 text-sm">Get instant feedback with live WPM, accuracy tracking, and mistake highlighting</p>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Target className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Detailed Reports</h3>
                <p className="text-gray-600 text-sm">Comprehensive analysis of your performance with downloadable PDF reports</p>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Progress Tracking</h3>
                <p className="text-gray-600 text-sm">Monitor your improvement over time with detailed history and statistics</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Input Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Start Your Typing Test</h2>
            <p className="text-gray-600 dark:text-gray-400">Choose how you'd like to input your text</p>
          </div>

          {/* Input Methods */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Text Input */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-lg font-semibold text-gray-900">
                <Type className="h-5 w-5 text-blue-600" />
                <span>Paste Text</span>
              </div>
              
              <div>
                <label htmlFor="textTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Text Title (Optional)
                </label>
                <input
                  id="textTitle"
                  type="text"
                  value={textTitle}
                  onChange={(e) => setTextTitle(e.target.value)}
                  placeholder="Enter a title for your text..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste your text here or use one of the sample texts below..."
                className="w-full h-40 p-4 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
              />
              
              {/* Sample Texts */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Quick Start - Sample Texts:</p>
                <div className="space-y-1">
                  {sampleTexts.map((text, index) => (
                    <button
                      key={index}
                      onClick={() => handleSampleText(text)}
                      className="block w-full text-left p-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded border dark:border-gray-600 transition-colors"
                    >
                      {text.substring(0, 80)}...
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-lg font-semibold text-gray-900">
                <FileText className="h-5 w-5 text-indigo-600" />
                <span>Upload File</span>
              </div>
              
              <div className="relative">
                <input
                  type="file"
                  accept=".txt,.pdf"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    isUploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {isUploading ? (
                      <LoadingSpinner size="lg" text="Processing file..." />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">TXT files (PDF support coming soon)</p>
                      </>
                    )}
                  </div>
                </label>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">Supported Formats:</h4>
                <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                  <li>• Plain text files (.txt)</li>
                  <li>• PDF files (.pdf)</li>
                  <li>• Maximum file size: 1MB</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Start Button */}
          <div className="text-center">
            <button
              onClick={handleTextSubmit}
              disabled={isUploading || !textInput.trim()}
              className={`px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                isUploading || !textInput.trim() 
                  ? 'opacity-50 cursor-not-allowed hover:scale-100' 
                  : 'hover:shadow-xl'
              }`}
            >
              {isUploading ? 'Processing File...' : 'Start Typing Test'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}