import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import instance from '../api';
import { Pencil, ChevronRight,ChevronLeft } from 'react-bootstrap-icons';

const TaskList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);
  const ITEMS_PER_PAGE = 10;

  // 1. Grab the status from the URL (e.g., ?status=Scheduled)
  const queryParams = new URLSearchParams(location.search);
  const statusFilter = queryParams.get('status');
  const currentPage = parseInt(queryParams.get('page') || '1', 10);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        // 2. Pass the status to your BE logic
        const params = new URLSearchParams();
        if (statusFilter) params.append('status', statusFilter);
        params.append('page', currentPage);
        params.append('limit', ITEMS_PER_PAGE);

        // const url = statusFilter 
        //   ? `/api/auth/tasks?status=${encodeURIComponent(statusFilter)}` 
        //   : '/api/auth/tasks';
          
        // const response = await instance.get(url);
        // if (response.data && response.data.tasks) {
        //   setTasks(response.data.tasks);
        //   setTotalPages(response.data.totalPages || 1);
        // } else {
        //   // Fallback if your BE just directly sends an array (without total pages yet)
        //   setTasks(response.data);
        const response = await instance.get(`/api/auth/tasks?${params.toString()}`);
        if (response.data && response.data.tasks) {
          setTasks(response.data.tasks);
          setTotalPages(response.data.totalPages || 1);
          setTotalTasks(response.data.totalTasks || 0); // Updates the data counter label layout now!
        } else {
          // Absolute fallback protection mechanism
          setTasks(Array.isArray(response.data) ? response.data : []);
          setTotalTasks(Array.isArray(response.data) ? response.data.length : 0);
          setTotalPages(1);
        }
      } catch (err) {
        console.error("Error fetching tasks:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [statusFilter, currentPage]); // 3. IMPORTANT: Re-run when the URL status or page changes

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(location.search);
    params.set('page', newPage); // Updates or sets the page param
    navigate(`${location.pathname}?${params.toString()}`);
  };

  const viewTask = async (id) => {
  try {
    const response = await instance.get(`/api/auth/tasks/${id}`);
    navigate(`/task-details/${id}`, { state: { task: response.data } });
  } catch (err) {
    console.error("Error fetching task details:", err);
    alert("Failed to fetch task details.");
  }
};

const startEntry = totalTasks === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endEntry = Math.min(currentPage * ITEMS_PER_PAGE, totalTasks);
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
                
              {/* ... other headers ... */}
            </tr>
          </thead>
          <tbody>
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <tr key={task.task_id} className="border-b hover:bg-slate-50">
                  <td className="p-3">
                    <div className="flex justify-center gap-3">
                      <button className="text-gray-400 hover:text-blue-600" onClick={() => viewTask(task.task_id)}>
                        <Pencil className="w-4 h-4" />
                      </button>
                      </div>
                      </td>
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
      {!loading && tasks.length > 0 && (
        <div className="flex justify-between items-center bg-white px-6 py-4 mt-4 border-t border-gray-100">
          
          {/* Left: Entries Info Label */}
          <div className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-700">{startEntry}</span> to{" "}
            <span className="font-semibold text-slate-700">{endEntry}</span> of{" "}
            <span className="font-semibold text-slate-700">{totalTasks}</span> entries
          </div>

          {/* Right: Controller blocks */}
          <div className="flex items-center gap-4">
            {/* Previous Arrow Button */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 border border-gray-200 rounded-lg bg-white text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Current Status Label */}
            <div className="text-sm font-medium text-slate-800 selection:bg-transparent">
              Page {currentPage} of {totalPages}
            </div>

            {/* Next Arrow Button */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-200 rounded-lg bg-white text-gray-800 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

export default TaskList;