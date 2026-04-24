import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Make sure to run 'npm install axios'
import { 
  Search, UserPlus, Download, ChevronDown, Pencil, Trash2, ChevronLeft, 
  ChevronRight, ChevronsLeft, ChevronsRight, Filter 
} from 'lucide-react';
import Sidebar from "../components/navigation/Sidebar"; 



export default function UserTable({ user }) {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]); // State to store your tasks
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Fetch Data from Backend ---
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        // Replace with your actual API endpoint (e.g., http://localhost:5000/api/tasks)
        const response = await axios.get('http://localhost:5001/api/auth/tasks');
        setTasks(response.data); 
      } catch (err) {
        setError("Failed to fetch tasks");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const deleteTask = async (id) => {
  if (window.confirm("Are you sure you want to delete this task?")) {
    try {
      // Call backend to delete from Database
      await axios.delete(`http://localhost:5001/api/auth/tasks/${id}`);

      // Update UI state to remove the deleted task
      setTasks(tasks.filter((task) => task.task_id !== id));
      
      alert("Task deleted successfully");
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete the task.");
    }
  }
};

const viewTask = async (id) => {
  try {
    const response = await axios.get(`http://localhost:5001/api/auth/tasks/${id}`);
    console.log("Task details:", response.data);
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
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar user={user}/>
      
      <div className="flex-1 flex flex-col overflow-y-auto p-6 ml-[250px] max-md:ml-[60px] transition-all duration-300">
        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
        {/* --- Toolbar (Same as your code) --- */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 flex-1 min-w-[300px]">
            <div className="relative w-full max-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" placeholder="Search tasks..." className="w-full pl-10 pr-4 py-2 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
                <th className="p-3"><input type="checkbox" className="rounded" /></th>
                <th className="p-3">Status</th>
                <th className="p-3">Schedule Date</th>
                <th className="p-3">Job Site</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Loads</th>
                <th className="p-3">Material</th>
                <th className="p-3">Trucker</th>
                <th className="p-3">Dump Facility</th>
                <th className="p-3">Invoice</th>
                <th className="p-3">Completed Date</th>
                <th className="p-3">Actual Loads</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {tasks.map((task) => (
                <tr key={task.task_id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="p-3"><input type="checkbox" className="rounded" /></td>
                  <td className="p-3">{task.status_name}</td>
                  <td className="p-3 font-medium text-gray-900">
                    {task.schedule_date ? (
                        new Date(task.schedule_date).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                    })
                    ): (
                        <span className="text-gray-500">No Date</span>
                    )}
                </td>
                  <td className="p-3 text-gray-600">{task.job_site}</td>
                  <td className="p-3 text-gray-600">{task.customer}</td>
                  <td className="p-3 text-gray-600">{task.loads}</td>
                  <td className="p-3 text-gray-600">{task.material}</td>
                  <td className="p-3 text-gray-600">{task.trucker}</td>
                  <td className="p-3 text-gray-600">{task.dump_facility}</td>
                  <td className="p-3 text-gray-600">{task.invoice || <span className="text-gray-400">No Invoice</span>}</td>
                  <td className="p-3 text-gray-600">{task.completed_date ? (
                        new Date(task.completed_date).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                        })
                    ) : (
                        <span className="text-gray-500">Not Completed</span>
                    )}</td>
                  <td className="p-3 text-gray-600">{task.actual_loads || <span className="text-gray-400">N/A</span>}</td>
                  <td className="p-3">
                    <div className="flex justify-center gap-3">
                      <button className="text-gray-400 hover:text-blue-600" onClick={() => viewTask(task.task_id)}>
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button className="text-gray-400 hover:text-red-600" onClick={() => deleteTask(task.task_id)}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </div>
  );
  }