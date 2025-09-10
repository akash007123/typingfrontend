import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Target, Zap, AlertTriangle, FileText, Filter, TrendingUp, Calendar } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { testService } from '../services/testService';
import { TypingTest } from '../types';

export function History() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [sortBy, setSortBy] = useState<'date' | 'wpm' | 'accuracy'>('date');
  const [filterBy, setFilterBy] = useState<'all' | 'high' | 'low'>('all');
  
  const userTests = useMemo(() => {
    if (!user) return [];
    return testService.getUserTests(user.id);
  }, [user]);

  const filteredAndSortedTests = useMemo(() => {
    let filtered = [...userTests];
    
    // Apply filters
    if (filterBy === 'high') {
      filtered = filtered.filter(test => test.wpm >= 50 && test.accuracy >= 90);
    } else if (filterBy === 'low') {
      filtered = filtered.filter(test => test.wpm < 50 || test.accuracy < 90);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'wpm':
          return b.wpm - a.wpm;
        case 'accuracy':
          return b.accuracy - a.accuracy;
        case 'date':
        default:
          return b.completedAt.getTime() - a.completedAt.getTime();
      }
    });
    
    return filtered;
  }, [userTests, sortBy, filterBy]);

  const stats = useMemo(() => {
    if (userTests.length === 0) {
      return { avgWpm: 0, avgAccuracy: 0, totalTests: 0, bestWpm: 0 };
    }
    
    const totalWpm = userTests.reduce((sum, test) => sum + test.wpm, 0);
    const totalAccuracy = userTests.reduce((sum, test) => sum + test.accuracy, 0);
    const bestWpm = Math.max(...userTests.map(test => test.wpm));
    
    return {
      avgWpm: Math.round(totalWpm / userTests.length),
      avgAccuracy: Math.round(totalAccuracy / userTests.length),
      totalTests: userTests.length,
      bestWpm
    };
  }, [userTests]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to view your typing history.</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Login Now
          </button>
        </div>
      </div>
    );
  }

  const handleRetryTest = (test: TypingTest) => {
    navigate('/test', {
      state: {
        text: test.text,
        source: test.textSource,
        filename: test.filename,
        title: test.title
      }
    });
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Typing History</h1>
          <p className="text-gray-600">Track your progress and improve your skills</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 text-center shadow-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats.totalTests}</div>
            <div className="text-sm text-gray-600">Total Tests</div>
          </div>

          <div className="bg-white rounded-xl p-6 text-center shadow-sm">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Zap className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.avgWpm}</div>
            <div className="text-sm text-gray-600">Average WPM</div>
          </div>

          <div className="bg-white rounded-xl p-6 text-center shadow-sm">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Target className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-indigo-600">{stats.avgAccuracy}%</div>
            <div className="text-sm text-gray-600">Average Accuracy</div>
          </div>

          <div className="bg-white rounded-xl p-6 text-center shadow-sm">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-yellow-600">{stats.bestWpm}</div>
            <div className="text-sm text-gray-600">Best WPM</div>
          </div>
        </div>

        {/* Filters and Sorting */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Filter className="h-5 w-5 text-gray-500" />
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="date">Date</option>
                  <option value="wpm">WPM</option>
                  <option value="accuracy">Accuracy</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Filter:</label>
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value as any)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Tests</option>
                  <option value="high">High Performance</option>
                  <option value="low">Needs Improvement</option>
                </select>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              Showing {filteredAndSortedTests.length} of {userTests.length} tests
            </div>
          </div>
        </div>

        {/* Test History */}
        {filteredAndSortedTests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {userTests.length === 0 ? 'No tests completed yet' : 'No tests match your filters'}
            </h3>
            <p className="text-gray-600 mb-6">
              {userTests.length === 0 
                ? 'Start your first typing test to see your progress here.'
                : 'Try adjusting your filter settings to see more results.'
              }
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Start New Test
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredAndSortedTests.map((test, index) => (
              <div key={test.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        #{index + 1}
                      </span>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(test.completedAt)}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 bg-blue-50 px-2 py-1 rounded">
                        {test.title}
                      </span>
                      {test.textSource === 'uploaded' && (
                        <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          📄 {test.filename}
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <Zap className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-gray-600">WPM:</span>
                        <span className="font-semibold text-green-600">{test.wpm}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Zap className="h-4 w-4 text-purple-600" />
                        <span className="text-sm text-gray-600">CPM:</span>
                        <span className="font-semibold text-purple-600">{test.cpm}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-gray-600">Accuracy:</span>
                        <span className="font-semibold text-blue-600">{test.accuracy}%</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-indigo-600" />
                        <span className="text-sm text-gray-600">Time:</span>
                        <span className="font-semibold text-indigo-600">{formatTime(test.totalTime)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="text-sm text-gray-600">Mistakes:</span>
                        <span className="font-semibold text-red-600">{test.mistakes}</span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-700 font-mono">
                        {test.text.substring(0, 150)}
                        {test.text.length > 150 && '...'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 lg:mt-0 lg:ml-6">
                    <button
                      onClick={() => handleRetryTest(test)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Retry Test
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}