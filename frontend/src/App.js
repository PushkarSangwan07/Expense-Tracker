import React, { useState, useEffect } from 'react';
import { Routes, Route } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

import Dashboard from './pages/Dashboard';
import Expense from './pages/expense';
import Navbar from './component/Navbar';
import Result from './pages/Result';
import LoginButton from './pages/Login';

function App() {
  const { isAuthenticated, user, getAccessTokenSilently } = useAuth0();
  const [expenses, setExpenses] = useState([]);

  const storageKey = user ? `expenses_${user.sub}` : null;

  useEffect(() => {
    const loadExpenses = async () => {
      if (!isAuthenticated) {
        setExpenses([]);
        return;
      }

      const cachedData = storageKey && localStorage.getItem(storageKey);
      if (cachedData) {
        setExpenses(JSON.parse(cachedData));
      }

      try {
        const token = await getAccessTokenSilently({
          audience: process.env.REACT_APP_AUTH0_AUDIENCE,
        });

        const res = await fetch('http://localhost:4000/api/expenses', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error('Failed to fetch expenses');
        const data = await res.json();
        setExpenses(data.data || []);
        if (storageKey) localStorage.setItem(storageKey, JSON.stringify(data.data || []));
      } catch (err) {
        console.error('Error fetching expenses:', err);
      }
    };

    loadExpenses();
  }, [isAuthenticated, user, getAccessTokenSilently, storageKey]);

  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(expenses));
    }
  }, [expenses, storageKey]);

  const handleDeleteLocal = (id) => {
    setExpenses(prev => prev.filter(item => item._id !== id && item.id !== id));
  };

  const addExpense = (newExpense) => {
    setExpenses(prev => [...prev, newExpense]);
  };

  return (
    <>
      {isAuthenticated && <Navbar />}

      <div className='div-container'>
        <Routes>
          <Route path='/' element={<LoginButton />} />
          <Route path='/dashboard' element={<Dashboard expenses={expenses} />} />
          <Route path='/expense' element={<Expense addExpense={addExpense} />} />
          <Route path='/result' element={<Result expenses={expenses} onDelete={handleDeleteLocal} />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
