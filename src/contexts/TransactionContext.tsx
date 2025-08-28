import React, { createContext, useContext, useState, useEffect } from 'react';
import { Transaction } from '@/types';

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => void;
  getTransactionsByUserId: (userId: string) => Transaction[];
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Load transactions from localStorage on mount
  useEffect(() => {
    const savedTransactions = localStorage.getItem('learn2earn_transactions');
    if (savedTransactions) {
      const parsedTransactions = JSON.parse(savedTransactions);
      // Convert date strings back to Date objects
      const transactionsWithDates = parsedTransactions.map((t: any) => ({
        ...t,
        date: new Date(t.date)
      }));
      setTransactions(transactionsWithDates);
    }
  }, []);

  // Save transactions to localStorage whenever transactions change
  useEffect(() => {
    localStorage.setItem('learn2earn_transactions', JSON.stringify(transactions));
  }, [transactions]);

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'date'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      date: new Date()
    };

    setTransactions(prev => [newTransaction, ...prev]);
  };

  const getTransactionsByUserId = (userId: string) => {
    // For demo purposes, we'll show all transactions since we don't have userId in Transaction model
    // In a real app, you'd filter by userId
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