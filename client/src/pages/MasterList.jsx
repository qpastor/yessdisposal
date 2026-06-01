import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, Pencil, ChevronLeft, ChevronRight, Ban } from 'lucide-react';
import instance from '../api'; // Import the configured Axios instance


export default function UserTable({ user }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [tasks, setTasks] = useState([]); // State to store your tasks
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);

  // --- Fetch Data from Backend ---
  useEffect(() => {
    const fetchTasks = async () => {
      // try {
      //   setLoading(true);
      //   // Replace with your actual API endpoint (e.g., http://localhost:5000/api/tasks)
      //   const response = await instance.get('/api/auth/tasks');
      //   setTasks(response.data); 
      // } catch (err) {
      //   setError("Failed to fetch tasks");
      //   console.error(err);
      // } finally {
      //   setLoading(false);
      // }
    try {
  setLoading(true);
  const response = await instance.get('/api/auth/tasks');
  
  // Check if response.data is the new object format with a tasks property
  if (response.data && response.data.tasks) {
    setTasks(response.data.tasks); // Extract the array out of the object
  } else {
    setTasks(Array.isArray(response.data) ? response.data : []); // Fallback protection
  }
} catch (err) {
  setError("Failed to fetch tasks");
  console.error(err);
} finally {
  setLoading(false);
}
    };

    fetchTasks();
  }, []);

  // Reset to page 1 when searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredTasks = tasks.filter((task) => {
  // If the search bar is empty, show everything
  if (!searchQuery) return true;

  const query = searchQuery.toLowerCase();

  // Define which columns the "Automatic Search" should look into
  return (
    task.status_name?.toLowerCase().includes(query) ||
    task.job_site?.toLowerCase().includes(query) ||
    task.customer?.toLowerCase().includes(query) ||
    task.trucker?.toLowerCase().includes(query) ||
    task.material?.toLowerCase().includes(query) ||
    task.yess_invoice?.toString().includes(query) // Convert numbers/IDs to string
  );
});

  const deleteTask = async (id) => {
  if (window.confirm("Are you sure you want to delete this task?")) {
    try {
      // Call backend to delete from Database
      await instance.delete(`/api/auth/tasks/${id}`);

      // Update UI state to remove the deleted task
      setTasks(tasks.filter((task) => task.task_id !== id));
      
      alert("Task deleted successfully");
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete the task.");
    }
  }
};

// --- Pagination Logic ---
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredTasks.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredTasks.length / recordsPerPage);

const viewTask = async (id) => {
  try {
    const response = await instance.get(`/api/auth/tasks/${id}`);
    navigate(`/task-details/${id}`, { state: { task: response.data } });
  } catch (err) {
    console.error("Error fetching task details:", err);
    alert("Failed to fetch task details.");
  }
};

   const addTask = (e) => {
    e.preventDefault();
    navigate('/task-registration');
  };
  

  if (loading) return <div className="p-10 text-center">Loading tasks...</div>;
  if (error) return <div className="p-10 text-center text-red-500">{error}</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
        {/* --- Toolbar (Same as your code) --- */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 flex-1 min-w-[300px]">
            <div className="relative w-full max-sm">
            <input
            type="text"
            placeholder="Search for Status, Job Site, Customer, Trucker, Material, or Yess Invoice"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
  />
  {/* Search Icon */}
  <span className="absolute left-3 top-2.5 text-slate-400">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  </span>
  
  {/* Clear Button (Only shows when there is text) */}
  {searchQuery && (
    <button 
      onClick={() => setSearchQuery("")}
      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
    >
      ✕
    </button>
  )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={addTask} className="flex items-center gap-2 px-4 py-2 bg-[#2D3E50] text-white rounded-md text-sm font-medium hover:bg-slate-700">
            <UserPlus className="w-4 h-4"/> Add Task
            </button>
          </div>
        </div>

        {/* --- Table --- */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#2D3E50] text-white text-sm font-medium">
                {/* <th className="p-3"><input type="checkbox" className="rounded" /></th> */}
                <th className="p-3 text-center">Actions</th>
                <th className="p-3">Status</th>
                <th className="p-3">Created On</th>
                <th className="p-3">Schedule Date</th>
                <th className="p-3">Job Site</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Loads</th>
                <th className="p-3">Material</th>
                <th className="p-3">Trucker</th>
                <th className="p-3">Dump Facility</th>
                <th className="p-3">Yess Invoice</th>
                <th className="p-3">Completed Date</th>
                <th className="p-3">Actual Loads</th>
                <th className="p-3">Trucker Invoice</th>
                <th className="p-3">Dump Facility Invoice</th>
                <th className="p-3">Notes</th>
                
              </tr>
            </thead>
            <tbody>
  {currentRecords.length > 0 ? (
    currentRecords.map((task) => (
      <tr key={task.id} className="border-b hover:bg-slate-50 transition-colors">
        <td className="p-3">
                    <div className="flex justify-center gap-3">
                      <button className="text-gray-400 hover:text-blue-600" onClick={() => viewTask(task.task_id)}>
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  </td>   
        <td className="p-3">{task.status_name}</td>
        <td className="p-3">{new Date(task.created_at).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                    })}</td>
                    <td className="p-3 font-semibold">{new Date(task.schedule_date).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                    })}</td>
        <td className="p-3">{task.job_site}</td>
        <td className="p-3">{task.customer}</td>
        <td className="p-3">{task.loads}</td>
        <td className="p-3">{task.material}</td>
        <td className="p-3">{task.trucker}</td>
        <td className="p-3">{task.dump_facility}</td>
        <td className="p-3">{task.invoice || <span className="text-slate-500 italic">No Invoice</span>}</td>
        <td className="p-3">{new Date(task.completed_date).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                    })|| <span className="text-slate-500 italic">N/A</span>}</td>
        <td className="p-3">{task.actual_loads === "Empty" || task.actual_loads === 0 || task.actual_loads === "0" ? "N/A" : task.actual_loads}
                      </td>
        <td className="p-3">{task.trucker_invoice || <span className="text-slate-500 italic">No Invoice</span>}</td>
        <td className="p-3">{task.dump_facility_invoice || <span className="text-slate-500 italic">No Invoice</span>}</td>
        <td className="p-3">{task.remarks || <span className="text-slate-500 italic">N/A</span>}</td>
             
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan="100%" className="p-10 text-center text-slate-500 italic">
        No results found for "{searchQuery}"
      </td>
    </tr>
  )}
</tbody>

          </table>
        </div>
        {/* --- Pagination Controls --- */}
        <div className="flex items-center justify-between mt-6 px-2">
          <p className="text-sm text-slate-600">
            Showing <span className="font-semibold">{indexOfFirstRecord + 1}</span> to{" "}
            <span className="font-semibold">{Math.min(indexOfLastRecord, filteredTasks.length)}</span> of{" "}
            <span className="font-semibold">{filteredTasks.length}</span> entries
          </p>
          
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className={`p-2 rounded-md border ${currentPage === 1 ? 'bg-gray-50 text-gray-300 cursor-not-allowed' : 'hover:bg-gray-50 border-gray-300'}`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center px-4 text-sm font-medium">
              Page {currentPage} of {totalPages || 1}
            </div>

            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className={`p-2 rounded-md border ${currentPage === totalPages || totalPages === 0 ? 'bg-gray-50 text-gray-300 cursor-not-allowed' : 'hover:bg-gray-50 border-gray-300'}`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
  );
  }