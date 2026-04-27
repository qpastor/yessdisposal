import React, { useState, useEffect } from 'react';
import { Save, XCircle } from 'lucide-react';
import Sidebar from "../components/navigation/Sidebar";
import { useNavigate } from 'react-router-dom';
import instance from '../api'; // Import the configured Axios instance

const UserRegistrationForm = ({ user }) => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    email: '',
    isactive: true, // Default to true for new users
    role_id: ''
  });

  const [roles, setRoles] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await instance.get('/api/auth/roles');
        setRoles(response.data);
      } catch (err) {
        console.error("Error fetching roles:", err);
      }
    };
    fetchRoles();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await instance.post('/api/auth/user-register', formData);

      if (response.status === 200 || response.status === 201) {
        alert('User registered successfully!');
        navigate('/user-management');
      }
    } catch (err) {

      const errorMessage = err.response?.data?.error || 'Failed to register user';
      alert(`Error: ${errorMessage}`);
      console.error("Registration error:", err);
    }
  };
  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   try {
  //     const response = await fetch('http://localhost:5001/api/auth/user-register', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       credentials: 'include',
  //       body: JSON.stringify(formData),
  //     });

  //     const data = await response.json();
  //     if (response.ok) {
  //       alert('User registered successfully!');
  //       navigate('/user-management');
  //     } else {
  //       alert(`Error: ${data.error || 'Failed to register user'}`);
  //     }
  //   } catch (err) {
  //     alert('Could not connect to the server.');
  //   }
  // };

  const handleClear = () => {
    setFormData({ name: '', username: '', password: '', email: '', isactive: true, role_id: '' });
  };

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-hidden">
      <Sidebar user={user} />

      {/* Responsive margin added here */}
      <main className="flex-1 ml-[250px] max-md:ml-[60px] transition-all duration-300 overflow-y-auto">
        <header className="bg-white p-6 shadow-sm border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-[#1e293b]">User Registration</h2>
        </header>

        <div className="w-full max-w-5xl mx-auto p-4 md:p-8">
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="px-8 pt-8 pb-4">
              <h3 className="text-lg font-bold text-gray-800 mb-2">User Information</h3>
              <div className="h-1 bg-blue-500 w-16 mb-8 rounded-full"></div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                  {/* Full Name */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" required />
                  </div>

                  {/* Email */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email *</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="johndoe@example.com" className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" required />
                  </div>

                  {/* Username */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Username *</label>
                    <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="jdoe_admin" className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" required />
                  </div>

                  {/* Password */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Password *</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" required />
                  </div>

                  {/* Role Selection */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Role *</label>
                    <select name="role_id" value={formData.role_id} onChange={handleChange} className="px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" required>
                      <option value="" disabled>Select a role</option>
                      {roles.map((role) => (
                        <option key={role.role_id} value={role.role_id}>{role.role_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-6 pb-8">
                  <button type="submit" className="flex items-center justify-center gap-2 px-8 py-3 bg-[#2D3E50] text-white font-semibold rounded-lg hover:bg-slate-700 transition-all shadow-lg active:scale-95">
                    <Save size={18} /> Save User
                  </button>
                  <button type="button" onClick={handleClear} className="flex items-center gap-2 px-8 py-3 bg-white text-gray-600 font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-all active:scale-95">
                    <XCircle size={18} /> Clear
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserRegistrationForm;