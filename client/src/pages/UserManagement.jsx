import React, { useState, useEffect } from 'react';
import { 
  Search, UserPlus, Download, ChevronLeft, ChevronRight, Ban, Check
} from 'lucide-react'; 
import instance from '../api'; // Import the configured Axios instance
import Modal from '../components/ui/Modal';

export default function UserManagement({ user }) {
  const [users, setUsers] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('view');
  const [editForm, setEditForm] = useState({ name: '', username: '', email: '', role_id: '', password: '' });

  // State for the Modal and Selected User
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalNotification, setModalNotification] = useState({ type: '', message: '' });
  const [confirmAction, setConfirmAction] = useState({ isOpen: false, type: '', userId: null });

  // --- Search and Pagination ---
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);

  // Check if the logged-in user is an Admin for feature gating
  const isAdmin = user?.role_name === 'Admin';
  const isViewOnly = user?.role_name === 'View Only';

  // --- Fetch Users from Backend ---
  const fetchUsers = async () => {
    try {
      setLoading(true);
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

  const handleExportExcel = async () => {
    try {
      const response = await instance.get('/api/auth/users/export-excel', {
        responseType: 'blob', 
      });

      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', 'Yess-Users-List.xlsx');
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Excel Export Error:", err);
      alert("Failed to export Excel file. Please try again.");
    }
  };

  // --- Automatic Search Logic ---
  const filteredUsers = users.filter((u) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    
    return (
      u.name?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query) ||
      u.username?.toLowerCase().includes(query) ||
      u.password?.toLowerCase().includes(query) ||
      u.role_name?.toLowerCase().includes(query)
    );
  });

  const disableUser = async (id, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setConfirmAction({ isOpen: true, type: 'disable', userId: id });
  };

  const enableUser = (id, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setConfirmAction({ isOpen: true, type: 'enable', userId: id });
  };

  const executeConfirmAction = async () => {
    const { type, userId } = confirmAction;
    try {
      if (type === 'enable') {
        await instance.put(`/api/auth/users/${userId}/enable`);
        setModalNotification({ type: 'success', message: "User enabled successfully!" });
        if (selectedUser && selectedUser.userid === userId) {
        setSelectedUser(prev => ({ ...prev, isactive: true }));
      }
      } else if (type === 'disable') {
        await instance.put(`/api/auth/users/${userId}/disable`);
        setModalNotification({ type: 'success', message: "User disabled successfully!" });
        if (selectedUser && selectedUser.userid === userId) {
        setSelectedUser(prev => ({ ...prev, isactive: false }));
      }
      }
      
      await fetchUsers();
      
      // Delay closing slightly so they see the toast confirmation
      setTimeout(() => {
        setModalNotification({ type: '', message: '' });
      }, 3000);
    } catch (err) {
      console.error(`${type} error:`, err);
      setModalNotification({ 
        type: 'error', 
        message: `Failed to ${type} the user.` 
      });
    } finally {
      setConfirmAction({ isOpen: false, type: '', userId: null });
    }
  };

  // Opens the modal with user context
  const openUserModal = (targetUser, type = 'view') => {
    setSelectedUser(targetUser);

    if (type === 'add') {
      setEditForm({
        name: '',
        username: '',
        email: '',
        password: '',
        role_id: ''
      });
    } else {
      setEditForm({
        name: targetUser?.name || '',
        username: targetUser?.username || '',
        email: targetUser?.email || '',
        password: '',
        role_id: targetUser?.role_id || ''
      });
    }

    setModalType(type); 
    setIsModalOpen(true);
  };

  // Closes the modal
  const closeUserModal = () => {
    setSelectedUser(null);
    setModalType(null);
    setIsModalOpen(false);
    setModalNotification({ type: '', message: '' });
    setConfirmAction({ isOpen: false, type: '', userId: null });
  };

const handleSaveUser = async () => {
  // 1. FRONTEND VALIDATION FOR NEW USERS
  if (!selectedUser) { 
    if (!editForm.name || !editForm.name.trim()) {
      setModalNotification({ type: 'error', message: "Please enter a Full Name." });
      return;
    }
    if (!editForm.username || !editForm.username.trim()) {
      setModalNotification({ type: 'error', message: "Please enter a Username." });
      return;
    }
    if (!editForm.email || !editForm.email.trim()) {
      setModalNotification({ type: 'error', message: "Please enter an Email Address." });
      return;
    }
    if (!editForm.role_id) {
      setModalNotification({ type: 'error', message: "Please select a Role." });
      return;
    }
    if (!editForm.password || !editForm.password.trim()) {
      setModalNotification({ type: 'error', message: "Please enter a Password." });
      return;
    }
  }

  // 2. BACKEND API SYNC LOGIC
  try {
    if (selectedUser) {
      // --- EDITING EXISTING USER ---
      await instance.put(`/api/auth/users/${selectedUser.userid}`, editForm);
      setModalNotification({ type: 'success', message: "User details updated successfully!" });
      
      await fetchUsers();
      setTimeout(() => {
        setModalType('view');
        setModalNotification({ type: '', message: '' });
      }, 1000);

    } else {
      // --- ADDING NEW USER ---
      const registrationPayload = {
        name: editForm.name.trim(),
        username: editForm.username.trim(),
        email: editForm.email.trim(),
        password: editForm.password,
        role_id: Number(editForm.role_id), 
        isactive: true
      };

      const response = await instance.post('/api/auth/user-register', registrationPayload);
      setModalNotification({ type: 'success', message: "New user added successfully!" });
      
      // 1. Refresh the main table array
      const updatedUsers = await instance.get('/api/auth/users');
      setUsers(updatedUsers.data);

      // 2. Find the newly created user object from the database response or the refreshed list
      // If your backend returns the saved user object in `response.data.user`, use that.
      // Otherwise, match it from the freshly pulled list via username/email:
      const newUser = response.data?.user || updatedUsers.data.find(u => u.username === registrationPayload.username);

      // 3. Immediately transition the modal state into View mode for this new user
      if (newUser) {
        setSelectedUser(newUser);
      } else {
        // Fallback context if matching fails
        setSelectedUser({
          ...registrationPayload,
          role_name: editForm.role_id == 1 ? 'Admin' : editForm.role_id == 2 ? 'User' : 'View Only'
        });
      }

      setModalType('view');

      // Clear out the success banner automatically after 3 seconds
      setTimeout(() => {
        setModalNotification({ type: '', message: '' });
      }, 3000);
    }
    
  } catch (err) {
    console.error("Error updating user:", err);
    const backendError = err.response?.data?.error || `Failed to ${selectedUser ? 'update' : 'add'} user details.`;
    setModalNotification({ type: 'error', message: backendError });
  }
};

  // --- Pagination Data Split ---
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
          {!isViewOnly && (
            <>
              <button 
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-50 text-gray-600"
              >
                <Download className="w-4 h-4" /> Export
              </button>
              
              <button 
                onClick={() => openUserModal(null, 'add')} 
                className="flex items-center gap-2 px-4 py-2 bg-[#2D3E50] text-white rounded-md text-sm font-medium hover:bg-slate-700 transition-colors"
              >
                <UserPlus className="w-4 h-4"/> Add User
              </button>
            </>
          )}
        </div>
      </div>

      {/* --- Table Section --- */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-[#2D3E50] text-white text-sm font-medium">
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
                <tr 
                  key={u.userid} 
                  onClick={() => openUserModal(u, 'view')}
                  className="border-b last:border-none hover:bg-gray-100 cursor-pointer transition-colors"
                >
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
            ) : (
              <tr>
                <td colSpan="5" className="p-4 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- Pagination Info --- */}
      <div className="flex flex-wrap items-center justify-between mt-6 gap-4 text-sm text-gray-600">
        <div>
          Showing <span className="font-semibold">{filteredUsers.length === 0 ? 0 : indexOfFirstRecord + 1}</span> to{" "}
          <span className="font-semibold">{Math.min(indexOfLastRecord, filteredUsers.length)}</span> of{" "}
          <span className="font-semibold">{filteredUsers.length}</span> entries
        </div>
        
        <div className="flex items-center gap-1">
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
          
          <div className="flex items-center px-4 text-sm font-medium text-slate-800">
            Page {currentPage} of {totalPages || 1}
          </div>
          
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

      {/* --- Reusable Modal Frame --- */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={closeUserModal} 
        title={
          modalType === 'add' ? 'Register User' : 
          modalType === 'edit' ? 'Edit User Details' : 'User Details'
        }
      >
        <div className="space-y-4">
          
          {/* Notifications Banner Inside Modal */}
          {modalNotification.message && (
            <div className={`p-3 text-sm rounded border ${
              modalNotification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {modalNotification.message}
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Name</label>
              {modalType === 'view' ? (
                <p className="mt-1 text-sm text-gray-900 font-medium">{selectedUser?.name}</p>
              ) : (
                <input 
                  type="text"
                  className="mt-1 w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Username</label>
              {modalType === 'view' ? (
                <p className="mt-1 text-sm text-gray-900">{selectedUser?.username}</p>
              ) : (
                <input 
                  type="text"
                  className="mt-1 w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                />
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Account Status
              </label>
              {modalType === 'add' ? (
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  Active
                </span>
              ) : (
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  selectedUser?.isactive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {selectedUser?.isactive ? 'Active' : 'Inactive'}
                </span>
              )}
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Email Address</label>
              {modalType === 'view' ? (
                <p className="mt-1 text-sm text-gray-900">{selectedUser?.email}</p>
              ) : (
                <input 
                  type="email"
                  className="mt-1 w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</label>
              {modalType === 'view' ? (
                <p className="mt-1 text-sm text-gray-900">{selectedUser?.role_name}</p>
              ) : (
                <select 
                  className="mt-1 w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                  value={editForm.role_id}
                  onChange={(e) => setEditForm({ ...editForm, role_id: e.target.value })}
                >
                  <option value="" disabled>Select a Role</option>
                  <option value={1}>Admin</option>
                  <option value={2}>User</option>
                  <option value={3}>View Only</option>
                </select>
              )}
            </div>
            {modalType === 'add' && (
              <div className="col-span-3">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Password</label>
                <input 
                  type="password"
                  placeholder="Enter secure password"
                  className="mt-1 w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none"
                  value={editForm.password || ''}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  required
                />
              </div>
            )}
          </div>

          {/* --- Modal Actions Footer Segment --- */}
          {confirmAction.isOpen ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-md my-4 transition-all">
              <p className="text-sm text-amber-800 font-medium">
                Are you sure you want to <span className="font-bold underline">{confirmAction.type}</span> this user account?
              </p>
              <div className="mt-3 flex gap-2 justify-end">
                <button
                  onClick={() => setConfirmAction({ isOpen: false, type: '', userId: null })}
                  className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded hover:bg-white text-gray-700 transition-colors"
                >
                  No, Cancel
                </button>
                <button
                  onClick={executeConfirmAction}
                  className={`px-3 py-1.5 text-xs font-medium text-white rounded transition-colors ${
                    confirmAction.type === 'disable' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  Yes, Proceed
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-4 flex justify-between items-center border-t mt-6 gap-2">
              <div>
                {isAdmin && selectedUser && modalType === 'view' && (
                  selectedUser?.isactive ? (
                    <button 
                      onClick={(e) => disableUser(selectedUser.userid, e)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors border border-transparent hover:border-red-200"
                    >
                      <Ban className="w-3.5 h-3.5" /> Disable User
                    </button>
                  ) : ( 
                    <button 
                      onClick={(e) => enableUser(selectedUser.userid, e)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-green-600 hover:bg-green-50 rounded-md transition-colors border border-transparent hover:border-green-200"
                    >
                      <Check className="w-3.5 h-3.5" /> Enable User
                    </button>
                  )
                )}
              </div>
              <div className="flex gap-2">
                {modalType === 'view' ? (
                  <>
                    <button 
                      onClick={closeUserModal}
                      className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-100 text-gray-700 transition-colors"
                    >
                      Close
                    </button>
                    {!isViewOnly && (
                      <button 
                        onClick={() => setModalType('edit')}
                        className="flex items-center gap-2 px-4 py-2 bg-[#2D3E50] text-white rounded-md text-sm font-medium hover:bg-slate-700 transition-colors"
                      >
                        Edit Profile
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => {
                        if (modalType === 'add') {
                          closeUserModal(); 
                        } else {
                          setModalType('view'); 
                          setModalNotification({ type: '', message: '' });
                        }
                      }}
                      className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-100 text-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveUser}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
                    >
                      {modalType === 'add' ? 'Register User' : 'Save Changes'}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
          
        </div>
      </Modal>

    </div>
  );
}