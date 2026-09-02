import React, { useState, useEffect } from 'react';
import { Calendar, Filter, Download, RotateCcw, FileText } from 'lucide-react';
import instance from '../api';

export default function TaskReports() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- Filter Options Datasets ---
  const [statuses, setStatuses] = useState([]);
  const [jobsiteList, setJobsiteList] = useState([]);
  const [customerList, setCustomerList] = useState([]);
  const [truckerList, setTruckerList] = useState([]);
  const [dumpFacilityList, setDumpFacilityList] = useState([]);
  const [materialsList, setMaterialsList] = useState([]);

  // --- Filter Form State ---
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    status_id: '',
    job_site_id: '',
    customer_id: '',
    trucker_id: '',
    dump_facility_id: '',
    material_id: ''
  });

  // --- Generated Report State ---
  const [reportData, setReportData] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const extractArray = (resData, key) => {
    if (!resData) return [];
    if (Array.isArray(resData)) return resData;
    if (key && Array.isArray(resData[key])) return resData[key];
    return [];
  };

  // --- Initialize Options ---
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const results = await Promise.allSettled([
          instance.get('/api/auth/customers'),
          instance.get('/api/auth/job-sites'),
          instance.get('/api/auth/truckers'),
          instance.get('/api/auth/dump-facilities'),
          instance.get('/api/auth/materials'),
          instance.get('/api/auth/status')
        ]);

        const [
          customerRes,
          jobsiteRes,
          truckerRes,
          dumpFacilityRes,
          materialsRes,
          statusRes
        ] = results;

        if (customerRes.status === 'fulfilled') setCustomerList(extractArray(customerRes.value.data, 'customers'));
        if (jobsiteRes.status === 'fulfilled') setJobsiteList(extractArray(jobsiteRes.value.data, 'jobSites'));
        if (truckerRes.status === 'fulfilled') setTruckerList(extractArray(truckerRes.value.data, 'truckers'));
        if (dumpFacilityRes.status === 'fulfilled') setDumpFacilityList(extractArray(dumpFacilityRes.value.data, 'dumpFacilities'));
        if (materialsRes.status === 'fulfilled') setMaterialsList(extractArray(materialsRes.value.data, 'materials'));
        if (statusRes.status === 'fulfilled') setStatuses(extractArray(statusRes.value.data, 'statuses'));

      } catch (err) {
        console.error("Failed to load filter options", err);
      }
    };

    fetchFilterOptions();
  }, []);

  // --- Handlers ---
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      start_date: '',
      end_date: '',
      status_id: '',
      job_site_id: '',
      customer_id: '',
      trucker_id: '',
      dump_facility_id: '',
      material_id: ''
    });
    setReportData([]);
    setHasSearched(false);
  };

  const handleGenerateReport = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    // Build query params
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });

    try {
      const response = await instance.get(`/api/auth/reports/tasks?${params.toString()}`);
      setReportData(extractArray(response.data, 'tasks'));
      setHasSearched(true);
    } catch (err) {
      console.error("Error generating report:", err);
      setError(err.response?.data?.message || "Failed to generate report.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });

    try {
      const response = await instance.get(`/api/auth/tasks/export-excel?${params.toString()}`, { 
        responseType: 'blob' 
      });
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `Task_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Export Error:", err);
      alert("Failed to export report.");
    }
  };

  // --- Metrics Calculation ---
  const totalTasks = reportData.length;
  const totalLoads = reportData.reduce((acc, curr) => acc + (Number(curr.loads) || 0), 0);
  const totalActualLoads = reportData.reduce((acc, curr) => acc + (Number(curr.actual_loads) || 0), 0);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC'
    });
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Custom Reports</h1>
          <p className="text-sm text-slate-500">Filter task data and generate exportable business records.</p>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <form onSubmit={handleGenerateReport} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Date Range */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Start Date</label>
              <input
                type="date"
                name="start_date"
                value={filters.start_date}
                onChange={handleFilterChange}
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">End Date</label>
              <input
                type="date"
                name="end_date"
                value={filters.end_date}
                onChange={handleFilterChange}
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Status</label>
              <select
                name="status_id"
                value={filters.status_id}
                onChange={handleFilterChange}
                className="w-full px-3 py-1.5 border border-gray-300 rounded bg-white text-sm focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="">All Statuses</option>
                {statuses.map(s => <option key={s.status_id} value={s.status_id}>{s.status_name}</option>)}
              </select>
            </div>

            {/* Job Site */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Job Site</label>
              <select
                name="job_site_id"
                value={filters.job_site_id}
                onChange={handleFilterChange}
                className="w-full px-3 py-1.5 border border-gray-300 rounded bg-white text-sm focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="">All Job Sites</option>
                {jobsiteList.map(j => <option key={j.job_site_id} value={j.job_site_id}>{j.job_site_name}</option>)}
              </select>
            </div>

            {/* Customer */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Customer</label>
              <select
                name="customer_id"
                value={filters.customer_id}
                onChange={handleFilterChange}
                className="w-full px-3 py-1.5 border border-gray-300 rounded bg-white text-sm focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="">All Customers</option>
                {customerList.map(c => <option key={c.customer_id} value={c.customer_id}>{c.customer_name}</option>)}
              </select>
            </div>

            {/* Trucker */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Trucker</label>
              <select
                name="trucker_id"
                value={filters.trucker_id}
                onChange={handleFilterChange}
                className="w-full px-3 py-1.5 border border-gray-300 rounded bg-white text-sm focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="">All Truckers</option>
                {truckerList.map(t => <option key={t.trucker_id} value={t.trucker_id}>{t.trucker_name}</option>)}
              </select>
            </div>

            {/* Dump Facility */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Dump Facility</label>
              <select
                name="dump_facility_id"
                value={filters.dump_facility_id}
                onChange={handleFilterChange}
                className="w-full px-3 py-1.5 border border-gray-300 rounded bg-white text-sm focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="">All Dump Facilities</option>
                {dumpFacilityList.map(d => <option key={d.dump_facility_id} value={d.dump_facility_id}>{d.dump_facility_name}</option>)}
              </select>
            </div>

            {/* Material */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Material</label>
              <select
                name="material_id"
                value={filters.material_id}
                onChange={handleFilterChange}
                className="w-full px-3 py-1.5 border border-gray-300 rounded bg-white text-sm focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="">All Materials</option>
                {materialsList.map(m => <option key={m.material_id} value={m.material_id}>{m.material_name}</option>)}
              </select>
            </div>

          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-50 text-gray-600 border-gray-300 transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Reset Filters
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-5 py-2 bg-[#2D3E50] text-white rounded-md text-sm font-medium hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              <Filter className="w-4 h-4" /> {loading ? "Generating..." : "Generate Report"}
            </button>
          </div>
        </form>
      </div>

      {/* Report Summary Cards */}
      {hasSearched && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Total Tasks</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{totalTasks}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500 opacity-80" />
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Total Estimated Loads</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{totalLoads}</p>
            </div>
            <span className="text-xl font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">Loads</span>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Total Actual Loads</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{totalActualLoads}</p>
            </div>
            <span className="text-xl font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">Actual</span>
          </div>
        </div>
      )}

      {/* Results Table Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-700">Report Results</h2>
          {hasSearched && reportData.length > 0 && (
            <button
              //onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              <Download className="w-4 h-4" /> Export Filtered Excel
            </button>
          )}
        </div>

        {error && <div className="p-6 text-center text-red-500">{error}</div>}

        {!hasSearched ? (
          <div className="p-12 text-center text-slate-400">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Select filters above and click <strong>Generate Report</strong> to retrieve data.</p>
          </div>
        ) : reportData.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="text-base font-medium">No records matching your selected criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#2D3E50] text-white text-xs font-semibold uppercase tracking-wider">
                  <th className="p-3">Status</th>
                  <th className="p-3">Sched Date</th>
                  <th className="p-3">Job Site</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Trucker</th>
                  <th className="p-3">Dump Facility</th>
                  <th className="p-3">Material</th>
                  <th className="p-3 text-center">Loads</th>
                  <th className="p-3 text-center">Actual Loads</th>
                  <th className="p-3">Yess Invoice</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
                {reportData.map((task, idx) => (
                  <tr key={task.task_id || idx} className="hover:bg-slate-50">
                    <td className="p-3 font-medium">{task.status_name}</td>
                    <td className="p-3">{formatDate(task.schedule_date)}</td>
                    <td className="p-3">{task.job_site_name}</td>
                    <td className="p-3">{task.customer_name}</td>
                    <td className="p-3">{task.trucker_name}</td>
                    <td className="p-3">{task.dump_facility_name}</td>
                    <td className="p-3">{task.material_name}</td>
                    <td className="p-3 text-center font-semibold">{task.loads ?? 0}</td>
                    <td className="p-3 text-center font-semibold text-indigo-600">{task.actual_loads ?? 0}</td>
                    <td className="p-3">{task.invoice || <span className="text-gray-400 italic">None</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}