import { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate} from 'react-router-dom';
// import {Home, Login, Dashboard, UserManagement, UserRegistration, UserPage, MasterList,TaskRegistration, TaskPage} from './pages';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import UserRegistration from './pages/UserRegistration';
import UserPage from './pages/UserPage';
import MasterList from './pages/MasterList';
import TaskRegistration from './pages/TaskRegistration';
import TaskPage from './pages/TaskPage';
import PageNotFound from './lib/PageNotFound';

console.log('Dashboard:', Dashboard);

function App() {

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  return (
      <QueryClientProvider client={queryClientInstance}>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true  }}>
          <Routes>
            <Route path="/" element={<Home />}/>
            <Route path="/login" element={<Login onLogin={handleLogin}/>} />
            <Route path="/dashboard" element={user ? <Dashboard user={user}/> : <Navigate to="/login" />} />
            <Route path="/user-management" element={user ? <UserManagement user={user}/> : <Navigate to="/login" />} />
            <Route path="/user-registration" element={user ? <UserRegistration user={user}/> : <Navigate to="/login" />} />            
            <Route path="/user-details/:id" element={user ? <UserPage user={user}/> : <Navigate to="/login" />} />
            <Route path="/master-list" element={user ? <MasterList user={user}/> : <Navigate to="/login" />} />
            <Route path="/task-registration" element={user ? <TaskRegistration user={user}/> : <Navigate to="/login" />} />
            <Route path="/task-details/:id" element={user ? <TaskPage user={user}/> : <Navigate to="/login" />} />
            
            <Route path="*" element={<PageNotFound />} />
           </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
  )
}

export default App