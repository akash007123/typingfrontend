export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: Date;
  isAdmin?: boolean;
  profile?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
}

export interface TypingTest {
  id: string;
  userId: string;
  text: string;
  title: string;
  textSource: 'pasted' | 'uploaded';
  filename?: string;
  wpm: number;
  cpm: number;
  accuracy: number;
  totalTime: number;
  expectedTime: number;
  mistakes: number;
  mistakeDetails: MistakeDetail[];
  improvementSuggestions: string[];
  completedAt: Date;
}

export interface MistakeDetail {
  position: number;
  expected: string;
  typed: string;
  word: string;
  wordIndex: number;
}

export interface TypingStats {
  wpm: number;
  cpm: number;
  accuracy: number;
  elapsedTime: number;
  correctChars: number;
  totalChars: number;
  mistakes: number;
  mistakeDetails?: MistakeDetail[];
  expectedTime: number;
  improvementSuggestions: string[];
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}
export interface UserProfile {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  createdAt: Date;
  isAdmin?: boolean;
}