import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './navigation/Sidebar'; // Adjust the path as needed

const Layout = ({ user }) => {
  // Protect all child routes at once
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar is rendered once and stays fixed */}
      <Sidebar user={user} />
      
      {/* The main content area that swaps child pages */}
      <main className="flex-1 ml-[250px] max-md:ml-[60px] transition-all duration-300 overflow-y-auto">
        <Outlet /> 
      </main>
    </div>
  );
};

export default Layout;