import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage'; // or expo-secure-store

interface User {
  id: string;
  name: string;
  role_id: number; // 1 = Admin, 2 = Field Manager
}

interface AuthContextType {
  user: User | null;
  roleId: number | null;
  isLoading: boolean;
  login: (userData: User) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Load saved user state on app startup
  useEffect(() => {
    async function loadStoredUser() {
      try {
        const storedUser = await AsyncStorage.getItem('@auth_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.error('Failed to load user session', e);
      } finally {
        setIsLoading(false);
      }
    }

    loadStoredUser();
  }, []);

  // 2. Call this function on successful login
  const login = async (userData: User) => {
    setUser(userData);
    await AsyncStorage.setItem('@auth_user', JSON.stringify(userData));
  };

  // 3. Call this function on logout
  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('@auth_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        roleId: user?.role_id ?? null,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to access auth context easily
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};