import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, companyService } from '../services/api';
import { useNotification } from './NotificationContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('bidwise_token') || null);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('bidwise_token');
      if (storedToken) {
        try {
          const res = await authService.getMe();
          if (res.data.success) {
            setUser(res.data.user);
            // Also fetch company profile
            try {
              const compRes = await companyService.getProfile();
              if (compRes.data.success) {
                setCompany(compRes.data.company);
              }
            } catch (cErr) {
              console.warn('Company profile fetch warning', cErr);
            }
          }
        } catch (err) {
          console.warn('Token initialization expired or invalid', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await authService.login({ email, password });
      if (res.data.success) {
        const { token, user } = res.data;
        localStorage.setItem('bidwise_token', token);
        setToken(token);
        setUser(user);

        // Fetch company
        try {
          const compRes = await companyService.getProfile();
          if (compRes.data.success) setCompany(compRes.data.company);
        } catch {}

        showNotification(`Welcome back, ${user.name}!`, 'success');
        return true;
      }
    } catch (error) {
      showNotification(error.message, 'error');
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const res = await authService.register(userData);
      if (res.data.success) {
        const { token, user } = res.data;
        localStorage.setItem('bidwise_token', token);
        setToken(token);
        setUser(user);

        try {
          const compRes = await companyService.getProfile();
          if (compRes.data.success) setCompany(compRes.data.company);
        } catch {}

        showNotification('Account and enterprise profile registered successfully!', 'success');
        return true;
      }
    } catch (error) {
      showNotification(error.message, 'error');
      throw error;
    }
  };

  const seedDemoLogin = async () => {
    try {
      setLoading(true);
      const res = await authService.seedDemo();
      if (res.data.success) {
        const { token, user, tenderId } = res.data;
        localStorage.setItem('bidwise_token', token);
        setToken(token);
        setUser(user);

        try {
          const compRes = await companyService.getProfile();
          if (compRes.data.success) setCompany(compRes.data.company);
        } catch {}

        showNotification('Interactive demo workspace loaded with sample tender & company profile!', 'success');
        return { success: true, tenderId };
      }
    } catch (error) {
      showNotification(error.message, 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('bidwise_token');
    setToken(null);
    setUser(null);
    setCompany(null);
    showNotification('Logged out successfully.', 'info');
  };

  const refreshCompany = async () => {
    try {
      const res = await companyService.getProfile();
      if (res.data.success) {
        setCompany(res.data.company);
      }
    } catch (err) {
      console.error('Failed to refresh company profile', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        token,
        loading,
        login,
        register,
        seedDemoLogin,
        logout,
        refreshCompany,
        isAuthenticated: !!token && !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
