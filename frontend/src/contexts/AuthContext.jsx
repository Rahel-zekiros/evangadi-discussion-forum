import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth/auth.service.js';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [authError, setAuthError] = useState(null);
  const navigate = useNavigate();

  // Runs once on mount: confirm active session against backend
  useEffect(() => {
    const initializeAuthStatus = async () => {
      const savedToken = authService.retrieveAuthToken();

      if (savedToken) {
        try {
          const verifiedUser = await authService.verifyActiveSession();
          setCurrentUser(verifiedUser);
        } catch {
          authService.clearSessionData();
          setCurrentUser(null);
        }
      }
      setIsAuthenticating(false);
    };

    initializeAuthStatus();
  }, []);

  const clearAuthError = () => setAuthError(null);

  const signup = async data => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const result = await authService.registerAccount(data);
      
      if (result.token && result.user) {
        localStorage.setItem("authToken", result.token);
        localStorage.setItem("activeUser", JSON.stringify(result.user));
        setCurrentUser(result.user);
      } else if (result.user && data.password) {
        const loginResult = await authService.loginAccount({
          email: data.email,
          password: data.password,
        });
        setCurrentUser(loginResult.user);
      }

      navigate('/'); 
      return { success: true, user: result.user };
    } catch (err) {
      const errorMsg = err.message || 'Registration failed. Please try again.';
      setAuthError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsAuthenticating(false);
    }
  };

  const signin = async credentials => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const { user } = await authService.loginAccount(credentials);
      setCurrentUser(user);
      navigate('/dashboard'); 
      return { success: true, user };
    } catch (err) {
      const errorMsg = err.message || 'Invalid email or password.';
      setAuthError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logoutUser = () => {
    authService.clearSessionData();
    setCurrentUser(null);
    setAuthError(null);
    navigate('/auth');
  };

  const updateUserProfile = updatedFields => {
    setCurrentUser(prev => (prev ? { ...prev, ...updatedFields } : null));
  };

  const contextValue = {
    currentUser,
    isAuthenticating,
    loading: isAuthenticating,
    authError,
    signup,
    signin,
    logoutUser,
    updateUserProfile,
    clearAuthError,
    isLoggedIn: !!currentUser,
    isAuthenticated: !!currentUser,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const authVal = useContext(AuthContext);
  if (!authVal) {
    throw new Error('useAuth must be wrapped inside AuthProvider');
  }
  return authVal;
}