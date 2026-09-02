import { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

// Layout
import Layout from './components/Layout';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import MasterList from './pages/MasterList';
import TaskList from './pages/TaskList';
import RequestList from './pages/RequestList';
import Reports from './pages/Reports';
import PageNotFound from './lib/PageNotFound';


// Security Guard
import ProtectedRoute from './components/ProtectedRoute.jsx';

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser && savedUser !== "undefined") {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        return null;
      }
    }
    return null;
  });

  const handleLogin = (userData) => {
    if (userData) {
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } else {
      console.error("Login attempted with invalid user data");
    }
  };

  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />

          {/* Authenticated Layout Group */}
          <Route element={<Layout user={user} />}>
            
            {/* Admin Only Routes */}
            <Route element={<ProtectedRoute user={user} requiredRoles={['Admin', '1']} />}>
              <Route path="/user-management" element={<UserManagement user={user} />} />
            </Route>

            {/* Admin & Field Manager Shared Routes */}
            <Route element={<ProtectedRoute user={user} requiredRoles={['Admin', 'Field Manager', 1, 2, '1', '2']} />}>
              <Route path="/dashboard" element={<Dashboard user={user} />} />
              <Route path="/master-list" element={<MasterList user={user} />} />
              <Route path="/task" element={<TaskList user={user} />} />
              <Route path="/request-list" element={<RequestList user={user} />} />
              <Route path="/reports" element={<Reports user={user} />} />
            </Route>

          </Route>

          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;