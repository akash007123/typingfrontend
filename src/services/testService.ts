import { TypingTest, MistakeDetail } from '../types';
import { apiClient } from './apiClient';

export class TestService {
  private static instance: TestService;

  static getInstance(): TestService {
    if (!TestService.instance) {
      TestService.instance = new TestService();
    }
    return TestService.instance;
  }

  async submitTestResult(result: {
    testId: string;
    wpm: number;
    accuracy: number;
    duration: number;
    wordsTyped: number;
    charactersTyped: number;
    correctCharacters: number;
    incorrectCharacters: number;
    errors?: MistakeDetail[];
    keystrokes?: any[];
    startTime: Date;
    endTime: Date;
  }): Promise<any> {
    try {
      const response = await apiClient.submitTestResult({
        testId: result.testId,
        wpm: result.wpm,
        accuracy: result.accuracy,
        duration: result.duration,
        wordsTyped: result.wordsTyped,
        charactersTyped: result.charactersTyped,
        correctCharacters: result.correctCharacters,
        incorrectCharacters: result.incorrectCharacters,
        errors: result.errors || [],
        keystrokes: result.keystrokes || [],
        startTime: result.startTime.toISOString(),
        endTime: result.endTime.toISOString()
      });
      return response;
    } catch (error: any) {
      console.error('Failed to submit test result:', error);
      throw new Error(error.response?.data?.message || 'Failed to submit test result');
    }
  }

  async getAvailableTests(params?: {
    difficulty?: string;
    category?: string;
    duration?: number;
    page?: number;
    limit?: number;
  }): Promise<any> {
    try {
      const response = await apiClient.getTests(params);
      return response;
    } catch (error: any) {
      console.error('Failed to get tests:', error);
      throw new Error(error.response?.data?.message || 'Failed to get tests');
    }
  }

  async getRandomTest(params?: {
    difficulty?: string;
    category?: string;
    duration?: number;
  }): Promise<any> {
    try {
      const response = await apiClient.getRandomTest(params);
      return response;
    } catch (error: any) {
      console.error('Failed to get random test:', error);
      throw new Error(error.response?.data?.message || 'Failed to get random test');
    }
  }

  async getUserResults(params?: {
    page?: number;
    limit?: number;
    testId?: string;
    difficulty?: string;
    category?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<any> {
    try {
      const response = await apiClient.getResults(params);
      return response;
    } catch (error: any) {
      console.error('Failed to get user results:', error);
      throw new Error(error.response?.data?.message || 'Failed to get user results');
    }
  }

  async getUserStats(): Promise<any> {
    try {
      const response = await apiClient.getUserStats();
      return response;
    } catch (error: any) {
      console.error('Failed to get user stats:', error);
      throw new Error(error.response?.data?.message || 'Failed to get user stats');
    }
  }

  async getLeaderboard(type: 'global' | 'weekly' | 'monthly' = 'global', params?: {
    limit?: number;
    difficulty?: string;
    category?: string;
    duration?: number;
  }): Promise<any> {
    try {
      let response;
      switch (type) {
        case 'weekly':
          response = await apiClient.getWeeklyLeaderboard(params?.limit);
          break;
        case 'monthly':
          response = await apiClient.getMonthlyLeaderboard(params?.limit);
          break;
        default:
          response = await apiClient.getGlobalLeaderboard(params);
      }
      return response;
    } catch (error: any) {
      console.error('Failed to get leaderboard:', error);
      throw new Error(error.response?.data?.message || 'Failed to get leaderboard');
    }
  }

  // Legacy methods for backward compatibility (fallback to localStorage if API fails)
  saveTest(test: TypingTest): void {
    const TESTS_KEY = 'typingtest_tests';
    const tests = this.getTests();
    tests.push(test);
    localStorage.setItem(TESTS_KEY, JSON.stringify(tests));
  }

  getTests(): TypingTest[] {
    const TESTS_KEY = 'typingtest_tests';
    const stored = localStorage.getItem(TESTS_KEY);
    return stored ? JSON.parse(stored).map((test: any) => ({
      ...test,
      completedAt: new Date(test.completedAt)
    })) : [];
  }

  getUserTests(userId: string): TypingTest[] {
    return this.getTests()
      .filter(test => test.userId === userId)
      .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
  }

  deleteTest(testId: string): boolean {
    const TESTS_KEY = 'typingtest_tests';
    const tests = this.getTests();
    const updatedTests = tests.filter(test => test.id !== testId);
    
    if (updatedTests.length < tests.length) {
      localStorage.setItem(TESTS_KEY, JSON.stringify(updatedTests));
      return true;
    }
    return false;
  }

  getTestById(testId: string): TypingTest | null {
    const tests = this.getTests();
    return tests.find(test => test.id === testId) || null;
  }

  getAllTestsStats(): {
    totalTests: number;
    averageWpm: number;
    averageAccuracy: number;
    totalUsers: number;
  } {
    const tests = this.getTests();
    const uniqueUsers = new Set(tests.map(test => test.userId));
    
    if (tests.length === 0) {
      return { totalTests: 0, averageWpm: 0, averageAccuracy: 0, totalUsers: 0 };
    }

    const totalWpm = tests.reduce((sum, test) => sum + test.wpm, 0);
    const totalAccuracy = tests.reduce((sum, test) => sum + test.accuracy, 0);

    return {
      totalTests: tests.length,
      averageWpm: Math.round(totalWpm / tests.length),
      averageAccuracy: Math.round(totalAccuracy / tests.length),
      totalUsers: uniqueUsers.size
    };
  }
}

export const testService = TestService.getInstance();