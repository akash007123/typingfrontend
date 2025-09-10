import { useState, useEffect } from 'react';
import { AuthState } from '../types';
import { authService } from '../services/authService';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(authService.getAuthState());

  useEffect(() => {
    const unsubscribe = authService.subscribe(setAuthState);
    return unsubscribe;
  }, []);

  return {
    ...authState,
    login: authService.login.bind(authService),
    signup: authService.signup.bind(authService),
    logout: authService.logout.bind(authService)
  };
}