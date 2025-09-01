import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Transaction } from '@/types';
import { useAuth } from './AuthContext';

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => void;
  getTransactionsByUserId: (userId: string) => Transaction[];
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { authUser } = useAuth();

  // Fetch transactions from Supabase
  const fetchTransactions = async (userId: string) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data && !error) {
      const formattedTransactions = data.map(t => ({
        id: t.id,
        type: t.type as Transaction['type'],
        amount: t.amount,
        status: t.status as Transaction['status'],
        description: t.description || '',
        date: new Date(t.created_at)
      }));
      setTransactions(formattedTransactions);
    }
  };

  // Fetch transactions when user changes
  useEffect(() => {
    if (authUser) {
      fetchTransactions(authUser.id);
    } else {
      setTransactions([]);
    }
  }, [authUser]);

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'date'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      date: new Date()
    };

    setTransactions(prev => [newTransaction, ...prev]);
  };

  const getTransactionsByUserId = (userId: string) => {
    return transactions.slice(0, 10); // Show last 10 transactions
  };

  return (
    <TransactionContext.Provider value={{
      transactions,
      addTransaction,
      getTransactionsByUserId
    }}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
}