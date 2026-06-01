import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ClipboardList } from 'lucide-react';
import instance from '../api'; // Import the configured Axios instance


export default function RequestTable({ user }) {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]); // State to store your requests
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Fetch Data from Backend ---
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        // Replace with your actual API endpoint (e.g., http://localhost:5000/api/tasks)
        const response = await instance.get('/api/auth/requests');
        setRequests(response.data); 
      } catch (err) {
        setError("Failed to fetch requests");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

const viewRequest = async (id) => {
  try {
    const response = await instance.get(`/api/auth/requests/${id}`);
    navigate(`/request-details/${id}`, { state: { request: response.data } });
  } catch (err) {
    console.error("Error fetching request details:", err);
    alert("Failed to fetch request details.");
  }
};
  

  if (loading) return <div className="p-10 text-center">Loading requests...</div>;
  if (error) return <div className="p-10 text-center text-red-500">{error}</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
        {/* --- Toolbar (Same as your code) --- */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 flex-1 min-w-[300px]">
            <div className="relative w-full max-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" placeholder="Search requests..." className="w-full pl-10 pr-4 py-2 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        {/* --- Table --- */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#2D3E50] text-white text-sm font-medium">
                <th className="p-3">Request Number</th>
                <th className="p-3">Full Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Project Details</th>
                <th className="p-3">Requested Date</th>
                <th className="p-3">Contacted?</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {requests.map((request) => (
                <tr key={request.request_id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="p-3">{request.request_id}</td>
                  <td className="p-3 text-gray-600">{request.fullname}</td>
                  <td className="p-3 text-gray-600">{request.email}</td>
                  <td className="p-3 text-gray-600">{request.phone}</td>
                  <td className="p-3 text-gray-600">{request.project_details}</td>
                  <td className="p-3 text-gray-600">{new Date(request.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                  <td className="p-3 text-gray-600">{request.contacted ? 'Yes' : 'No'}</td>
                  <td className="p-3">
                    <div className="flex justify-center gap-3">
                      <button className="text-gray-400 hover:text-blue-600" onClick={() => viewRequest(request.request_id)}>
                        <ClipboardList className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
  );
  }