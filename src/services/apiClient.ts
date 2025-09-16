import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              const response = await this.client.post('/auth/refresh', {
                refreshToken,
              });

              const { token, refreshToken: newRefreshToken } = response.data;
              localStorage.setItem('auth_token', token);
              localStorage.setItem('refresh_token', newRefreshToken);

              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async register(username: string, email: string, password: string, firstName?: string, lastName?: string) {
    const response = await this.client.post('/auth/register', {
      username,
      email,
      password,
      firstName,
      lastName,
    });
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  async logout() {
    try {
      await this.client.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
  }

  // Test endpoints
  async getTests(params?: {
    difficulty?: string;
    category?: string;
    duration?: number;
    page?: number;
    limit?: number;
  }) {
    const response = await this.client.get('/tests', { params });
    return response.data;
  }

  async getRandomTest(params?: {
    difficulty?: string;
    category?: string;
    duration?: number;
  }) {
    const response = await this.client.get('/tests/random', { params });
    return response.data;
  }

  async getTest(id: string) {
    const response = await this.client.get(`/tests/${id}`);
    return response.data;
  }

  // Results endpoints
  async submitTestResult(result: {
    testId: string;
    wpm: number;
    accuracy: number;
    duration: number;
    wordsTyped: number;
    charactersTyped: number;
    correctCharacters: number;
    incorrectCharacters: number;
    errors?: any[];
    keystrokes?: any[];
    startTime: string;
    endTime: string;
  }) {
    const response = await this.client.post('/results', result);
    return response.data;
  }

  async getResults(params?: {
    page?: number;
    limit?: number;
    testId?: string;
    difficulty?: string;
    category?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const response = await this.client.get('/results', { params });
    return response.data;
  }

  async getResult(id: string) {
    const response = await this.client.get(`/results/${id}`);
    return response.data;
  }

  async deleteResult(id: string) {
    const response = await this.client.delete(`/results/${id}`);
    return response.data;
  }

  // User endpoints
  async getUserProfile() {
    const response = await this.client.get('/users/profile');
    return response.data;
  }

  async updateUserProfile(data: {
    firstName?: string;
    lastName?: string;
    preferredDifficulty?: string;
    preferredDuration?: number;
    theme?: string;
  }) {
    const response = await this.client.put('/users/profile', data);
    return response.data;
  }

  async getUserStats() {
    const response = await this.client.get('/users/stats');
    return response.data;
  }

  async getUserHistory(params?: {
    page?: number;
    limit?: number;
  }) {
    const response = await this.client.get('/users/history', { params });
    return response.data;
  }

  async getUserProgress(days?: number) {
    const response = await this.client.get('/users/progress', {
      params: { days },
    });
    return response.data;
  }

  // Leaderboard endpoints
  async getGlobalLeaderboard(params?: {
    limit?: number;
    difficulty?: string;
    category?: string;
    duration?: number;
  }) {
    const response = await this.client.get('/leaderboard/global', { params });
    return response.data;
  }

  async getWeeklyLeaderboard(limit?: number) {
    const response = await this.client.get('/leaderboard/weekly', {
      params: { limit },
    });
    return response.data;
  }

  async getMonthlyLeaderboard(limit?: number) {
    const response = await this.client.get('/leaderboard/monthly', {
      params: { limit },
    });
    return response.data;
  }

  async getTestLeaderboard(testId: string, limit?: number) {
    const response = await this.client.get(`/leaderboard/test/${testId}`, {
      params: { limit },
    });
    return response.data;
  }

  async getUserRank(userId: string) {
    const response = await this.client.get(`/leaderboard/user-rank/${userId}`);
    return response.data;
  }

  // Admin endpoints
  async getAllUsers() {
    const response = await this.client.get('/users/all');
    return response.data;
  }

  async deleteUser(userId: string) {
    const response = await this.client.delete(`/users/${userId}`);
    return response.data;
  }

  // Health check
  async healthCheck() {
    const response = await this.client.get('/health');
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
