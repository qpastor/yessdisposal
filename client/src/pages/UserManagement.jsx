import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Search, UserPlus, Download, ChevronDown, Pencil, Trash2, ChevronLeft, 
  ChevronRight, ChevronsLeft, ChevronsRight, Filter 
} from 'lucide-react';
import Sidebar from "../components/navigation/Sidebar"; 
import instance from '../api'; // Import the configured Axios instance

export default function UserTable({ user }) {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if the logged-in user is an Admin for feature gating
  const isAdmin = user?.role_name === 'Admin';

  // --- Fetch Users from Backend ---
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        // Updated endpoint to fetch users instead of tasks
        const response = await instance.get('/api/auth/users');
        setUsers(response.data); 
      } catch (err) {
        setError("Failed to fetch users");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const deleteUser = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await instance.delete(`/api/auth/users/${id}`);
        // Filter out the deleted user from state
        setUsers(users.filter((u) => u.userid !== id));
        alert("User deleted successfully");
      } catch (err) {
        console.error("Delete error:", err);
        alert("Failed to delete the user.");
      }
    }
  };

  const viewUserDetails = (id) => {
    navigate(`/user-details/${id}`);
  };

  const addUser = () => {
    navigate('/user-registration');
  };

  if (loading) return <div className="p-10 text-center">Loading user management...</div>;
  if (error) return <div className="p-10 text-center text-red-500">{error}</div>;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden antialiased">
      {/* 1. Sidebar remains fixed */}
      <Sidebar user={user}/>
      
      {/* 2. Main Content Wrapper with responsive margins to avoid sidebar overlap */}
      <div className="flex-1 flex flex-col overflow-y-auto p-4 md:p-6 ml-[250px] max-md:ml-[60px] transition-all duration-300">
        
        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
          
          {/* --- Toolbar --- */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 flex-1 min-w-[300px]">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Search users..." 
                  className="w-full pl-10 pr-4 py-2 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <button className="hidden sm:flex items-center gap-2 px-4 py-2 border rounded-full text-sm font-medium hover:bg-gray-50 text-gray-600">
                <Filter className="w-4 h-4" /> Role <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-50 text-gray-600">
                <Download className="w-4 h-4" /> Export
              </button>
              {isAdmin && (
                <button 
                  onClick={addUser} 
                  className="flex items-center gap-2 px-4 py-2 bg-[#2D3E50] text-white rounded-md text-sm font-medium hover:bg-slate-700 transition-colors"
                >
                  <UserPlus className="w-4 h-4"/> Add User
                </button>
              )}
            </div>
          </div>

          {/* --- Table Section --- */}
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-[#2D3E50] text-white text-sm font-medium">
                  <th className="p-4 w-10"><input type="checkbox" className="rounded" /></th>
                  <th className="p-4">Full Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Username</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Role</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {users.map((u) => (
                  <tr key={u.userid} className="border-b last:border-none hover:bg-gray-50 transition-colors">
                    <td className="p-4"><input type="checkbox" className="rounded" /></td>
                    <td className="p-4">
                      <span className="font-medium text-gray-900">{u.name}</span>
                    </td>
                    <td className="p-4 text-gray-600">{u.email}</td>
                    <td className="p-4 text-gray-600">{u.username}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        u.isactive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {u.isactive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600">{u.role_name}</td>
                    <td className="p-4">
                      <div className="flex justify-center gap-3">
                        <button 
                          title="Edit User"
                          className="text-gray-400 hover:text-blue-600 transition-colors" 
                          onClick={() => viewUserDetails(u.userid)}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          title="Delete User"
                          className="text-gray-400 hover:text-red-600 transition-colors" 
                          onClick={() => deleteUser(u.userid)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* --- Pagination Footer --- */}
          <div className="flex flex-wrap items-center justify-between mt-6 gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              Rows per page: 
              <select className="border rounded p-1 bg-white outline-none focus:ring-1 focus:ring-blue-500">
                <option>10</option>
                <option>20</option>
                <option>50</option>
              </select>
              <span className="ml-2">1-{users.length} of {users.length}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <button className="p-2 hover:bg-gray-100 rounded disabled:opacity-30" disabled><ChevronsLeft className="w-4 h-4" /></button>
              <button className="p-2 hover:bg-gray-100 rounded disabled:opacity-30" disabled><ChevronLeft className="w-4 h-4" /></button>
              <button className="px-3 py-1 bg-[#2D3E50] text-white rounded">1</button>
              <button className="p-2 hover:bg-gray-100 rounded disabled:opacity-30" disabled><ChevronRight className="w-4 h-4" /></button>
              <button className="p-2 hover:bg-gray-100 rounded disabled:opacity-30" disabled><ChevronsRight className="w-4 h-4" /></button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}