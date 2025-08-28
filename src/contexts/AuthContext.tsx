import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { MAX_WALLET_BALANCE } from '@/lib/constants';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, country: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  isLoading: boolean;
  hydrated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo
const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    country: 'Nigeria',
    balance: 1500, // Within 2000 limit
    totalEarnings: 4500,
    quizzesPlayed: 23,
    quizzesWon: 12,
    rank: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'
  },
  {
    id: '2',
    name: 'Admin User',
    email: 'admin@learn2earn.com',
    country: 'Nigeria',
    balance: MAX_WALLET_BALANCE, // Admin gets max limit
    totalEarnings: 10000,
    quizzesPlayed: 50,
    quizzesWon: 30,
    rank: 1,
    isAdmin: true,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin'
  }
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Check for saved user on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('learn2earn_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setHydrated(true);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    // Mock login - find user by email
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    
    const foundUser = mockUsers.find(u => u.email === email);
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('learn2earn_user', JSON.stringify(foundUser));
    } else {
      throw new Error('Invalid credentials');
    }
    setIsLoading(false);
  };

  const register = async (name: string, email: string, password: string, country: string) => {
    setIsLoading(true);
    // Mock registration
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    
    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      country,
      balance: Math.min(1000, MAX_WALLET_BALANCE), // Welcome bonus with limit check
      totalEarnings: 0,
      quizzesPlayed: 0,
      quizzesWon: 0,
      rank: 999,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
    };
    
    setUser(newUser);
    localStorage.setItem('learn2earn_user', JSON.stringify(newUser));
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('learn2earn_user');
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      
      // Enforce wallet balance limit
      if (updatedUser.balance && updatedUser.balance > MAX_WALLET_BALANCE) {
        updatedUser.balance = MAX_WALLET_BALANCE;
      }
      
      setUser(updatedUser);
      localStorage.setItem('learn2earn_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      updateUser,
      isLoading,
      hydrated
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}