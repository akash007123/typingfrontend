import { useState, useCallback } from 'react';

interface ErrorState {
  error: Error | null;
  isError: boolean;
}

export function useErrorHandler() {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isError: false
  });

  const handleError = useCallback((error: Error | string) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    console.error('Error caught by useErrorHandler:', errorObj);
    setErrorState({ error: errorObj, isError: true });
  }, []);

  const clearError = useCallback(() => {
    setErrorState({ error: null, isError: false });
  }, []);

  const withErrorHandling = useCallback(
    <T extends any[], R>(fn: (...args: T) => Promise<R> | R) => {
      return async (...args: T): Promise<R | void> => {
        try {
          const result = await fn(...args);
          return result;
        } catch (error) {
          handleError(error as Error);
        }
      };
    },
    [handleError]
  );

  return {
    error: errorState.error,
    isError: errorState.isError,
    handleError,
    clearError,
    withErrorHandling
  };
}
