import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import instance from '../api';
import { Pencil } from 'react-bootstrap-icons';

const TaskList = () => {
    const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 1. Grab the status from the URL (e.g., ?status=Scheduled)
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const statusFilter = queryParams.get('status');

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        // 2. Pass the status to your BE logic
        const url = statusFilter 
          ? `/api/auth/tasks?status=${encodeURIComponent(statusFilter)}` 
          : '/api/auth/tasks';
          
        const response = await instance.get(url);
        setTasks(response.data);
      } catch (err) {
        console.error("Error fetching tasks:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [statusFilter]); // 3. IMPORTANT: Re-run when the URL status changes


  const viewTask = async (id) => {
  try {
    const response = await instance.get(`/api/auth/tasks/${id}`);
    navigate(`/task-details/${id}`, { state: { task: response.data } });
  } catch (err) {
    console.error("Error fetching task details:", err);
    alert("Failed to fetch task details.");
  }
};
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">
          {statusFilter ? `${statusFilter} Tasks` : "All Tasks"}
        </h2>
        {/* Your search bar and Add Task button here */}
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800 text-white text-sm">
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
                <th className="p-3 text-center">Actions</th>
              {/* ... other headers ... */}
            </tr>
          </thead>
          <tbody>
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <tr key={task.task_id} className="border-b hover:bg-slate-50">
                  <td className="p-4">{task.status_name}</td>
                  <td className="p-4">{new Date(task.created_at).toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'})}</td>
                  <td className="p-3 font-medium text-gray-900">{new Date(task.schedule_date).toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'})}</td>
                  <td className="p-4">{task.job_site}</td>
                  <td className="p-4">{task.customer}</td>
                  <td className="p-4">{task.loads}</td>
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
                  <td className="p-3 text-gray-600">{task.trucker_invoice || <span className="text-gray-400">No Invoice</span>}</td>
                  <td className="p-3 text-gray-600">{task.dump_facility_invoice || <span className="text-gray-400">No Invoice</span>}</td>
                  <td className="p-3 text-gray-600">{task.remarks || <span className="text-gray-400">N/A</span>}</td>
                  <td className="p-3">
                    <div className="flex justify-center gap-3">
                      <button className="text-gray-400 hover:text-blue-600" onClick={() => viewTask(task.task_id)}>
                        <Pencil className="w-4 h-4" />
                      </button>
                      </div>
                      </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" className="p-10 text-center text-gray-500">
                  {loading ? "Loading tasks..." : "No tasks found for this status."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TaskList;