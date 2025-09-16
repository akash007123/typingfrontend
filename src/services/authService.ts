import { User, AuthState } from '../types';
import { apiClient } from './apiClient';

const STORAGE_KEY = 'typingtest_auth';

export class AuthService {
  private static instance: AuthService;
  private authState: AuthState = {
    isAuthenticated: false,
    user: null,
    loading: false
  };
  private listeners: ((state: AuthState) => void)[] = [];

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  constructor() {
    this.loadAuthState();
  }

  private loadAuthState(): void {
    const token = localStorage.getItem('auth_token');
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (token && stored) {
      try {
        const data = JSON.parse(stored);
        this.authState = {
          isAuthenticated: true,
          user: data.user,
          loading: false
        };
      } catch (error) {
        // Clear invalid stored data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.authState));
  }

  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getAuthState(): AuthState {
    return this.authState;
  }

  async login(email: string, password: string): Promise<{ success: boolean; message: string; user?: User }> {
    this.authState.loading = true;
    this.notifyListeners();

    try {
      const response = await apiClient.login(email, password);
      
      // Store tokens
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('refresh_token', response.refreshToken);
      
      // Transform backend user to frontend user format
      const user: User = {
        id: response.user.id,
        email: response.user.email,
        username: response.user.username,
        createdAt: new Date(response.user.createdAt || Date.now()),
        isAdmin: false // Backend doesn't have admin concept yet
      };

      this.authState = {
        isAuthenticated: true,
        user,
        loading: false
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user }));
      this.notifyListeners();

      return { success: true, message: response.message, user };
    } catch (error: any) {
      this.authState.loading = false;
      this.notifyListeners();
      
      const message = error.response?.data?.message || 'Login failed';
      return { success: false, message };
    }
  }

  async signup(email: string, username: string, password: string): Promise<{ success: boolean; message: string; user?: User }> {
    this.authState.loading = true;
    this.notifyListeners();

    try {
      const response = await apiClient.register(username, email, password);
      
      // Store tokens
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('refresh_token', response.refreshToken);
      
      // Transform backend user to frontend user format
      const user: User = {
        id: response.user.id,
        email: response.user.email,
        username: response.user.username,
        createdAt: new Date(response.user.createdAt || Date.now()),
        isAdmin: false
      };

      this.authState = {
        isAuthenticated: true,
        user,
        loading: false
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user }));
      this.notifyListeners();

      return { success: true, message: response.message, user };
    } catch (error: any) {
      this.authState.loading = false;
      this.notifyListeners();
      
      const message = error.response?.data?.message || 'Registration failed';
      return { success: false, message };
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.logout();
    } catch (error) {
      // Continue with logout even if API call fails
    }

    this.authState = {
      isAuthenticated: false,
      user: null,
      loading: false
    };
    
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem(STORAGE_KEY);
    this.notifyListeners();
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiClient.getCurrentUser();
      const user: User = {
        id: response.user.id,
        email: response.user.email,
        username: response.user.username,
        createdAt: new Date(response.user.createdAt || Date.now()),
        isAdmin: false
      };
      
      this.authState.user = user;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user }));
      this.notifyListeners();
      
      return user;
    } catch (error) {
      // Token might be invalid, logout
      await this.logout();
      return null;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const response = await apiClient.getAllUsers();
      return response.users.map((user: any) => ({
        id: user._id || user.id,
        email: user.email,
        username: user.username,
        createdAt: new Date(user.createdAt),
        isAdmin: user.role === 'admin'
      }));
    } catch (error) {
      console.error('Failed to fetch users:', error);
      return [];
    }
  }

  async deleteUser(userId: string): Promise<boolean> {
    try {
      await apiClient.deleteUser(userId);
      return true;
    } catch (error) {
      console.error('Failed to delete user:', error);
      return false;
    }
  }
}

export const authService = AuthService.getInstance();