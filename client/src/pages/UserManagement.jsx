import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, UserPlus, Download, Pencil, ChevronLeft, ChevronRight, Ban} from 'lucide-react'; 
import instance from '../api'; // Import the configured Axios instance

export default function UserTable({ user }) {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- New State for Search and Pagination ---
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);

  // Check if the logged-in user is an Admin for feature gating
  const isAdmin = user?.role_name === 'Admin';

  // --- Fetch Users from Backend ---
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
  useEffect(() => {
    fetchUsers();
  }, []);

  // Reset to page 1 automatically when user types in the search box
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // --- Automatic Search Logic ---
  const filteredUsers = users.filter((u) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    
    return (
      u.name?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query) ||
      u.username?.toLowerCase().includes(query) ||
      u.role_name?.toLowerCase().includes(query)
    );
  });

  const disableUser = async (id) => {
    if (window.confirm("Are you sure you want to disable this user?")) {
      try {
        await instance.put(`/api/auth/users/${id}/disable`);
        // Filter out the disabled user from state
        setUsers(users.filter((u) => u.userid !== id));
        await fetchUsers();
        alert("User disabled successfully");
      } catch (err) {
        console.error("Disable error:", err);
        alert("Failed to disable the user.");
      }
    }
  };

  const viewUserDetails = (id) => {
    navigate(`/user-details/${id}`);
  };

  const addUser = () => {
    navigate('/user-registration');
  };

  // --- Pagination Logic ---
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredUsers.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredUsers.length / recordsPerPage);

  if (loading) return <div className="p-10 text-center">Loading user management...</div>;
  if (error) return <div className="p-10 text-center text-red-500">{error}</div>;

  return (
        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
          
          {/* --- Toolbar --- */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            
            <div className="flex items-center gap-2 flex-1 min-w-[300px]">
              <div className="relative w-full flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Search Name, Email, Username, Role..." 
                  className="w-full pl-10 pr-4 py-2 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {/* Clear Button (Only shows when there is text) */}
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-sans text-xs"
              >
                ✕
              </button>
            )}
              </div>
              
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
                  <th className="p-4 text-center">Actions</th>
                  <th className="p-4">Full Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Username</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Role</th>
                  
                </tr>
              </thead>
              <tbody className="text-sm">
                {currentRecords.length > 0 ? (
              currentRecords.map((u) => (
                  <tr key={u.userid} className="border-b last:border-none hover:bg-gray-50 transition-colors">
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
                          title="Disable User"
                          className="text-gray-400 hover:text-red-600 transition-colors" 
                          onClick={() => disableUser(u.userid)}
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
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
                    
                  </tr>
                ))
              ) :(
                <tr>
                  <td colSpan="6" className="p-4 text-center text-gray-500">
                    No users found.
                  </td>
                </tr>
              )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between mt-6 gap-4 text-sm text-gray-600">
        <div>
          Showing <span className="font-semibold">{filteredUsers.length === 0 ? 0 : indexOfFirstRecord + 1}</span> to{" "}
          <span className="font-semibold">{Math.min(indexOfLastRecord, filteredUsers.length)}</span> of{" "}
          <span className="font-semibold">{filteredUsers.length}</span> entries
        </div>
        
        <div className="flex items-center gap-1">
          
         {/* Previous Page Button */}
  <button 
    className={`p-2 rounded-md border transition-colors ${
      currentPage === 1 
        ? 'bg-gray-50 text-gray-300 cursor-not-allowed border-gray-200' 
        : 'hover:bg-gray-50 border-gray-300 text-slate-700'
    }`} 
    disabled={currentPage === 1}
    onClick={() => setCurrentPage(prev => prev - 1)}
    title="Previous Page"
  >
    <ChevronLeft className="w-4 h-4" />
  </button>
  
  {/* Current Status Display */}
  <div className="flex items-center px-4 text-sm font-medium text-slate-800">
    Page {currentPage} of {totalPages || 1}
  </div>
  
  {/* Next Page Button */}
  <button 
    className={`p-2 rounded-md border transition-colors ${
      currentPage === totalPages || totalPages === 0
        ? 'bg-gray-50 text-gray-300 cursor-not-allowed border-gray-200' 
        : 'hover:bg-gray-50 border-gray-300 text-slate-700'
    }`} 
    disabled={currentPage === totalPages || totalPages === 0}
    onClick={() => setCurrentPage(prev => prev + 1)}
    title="Next Page"
  >
    <ChevronRight className="w-4 h-4" />
  </button>
        </div>
      </div>
    </div>
  );
}