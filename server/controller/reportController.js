import pool from '../config/db.js';
import ExcelJS from 'exceljs';

// Helper function to build dynamic report query and parameters
const buildTaskReportQuery = (queryParams) => {
  const { start_date, end_date, status_id, job_site_id, customer_id, trucker_id, dump_facility_id, material_id } = queryParams;

  let query = `
    SELECT t.*, 
           s.status_name, 
           j.job_site_name, 
           c.customer_name, 
           tr.trucker_name, 
           d.dump_facility_name, 
           m.material_name
    FROM tasks t
    LEFT JOIN status s ON t.status_id = s.status_id
    LEFT JOIN job_sites j ON t.job_site_id = j.job_site_id
    LEFT JOIN customers c ON t.customer_id = c.customer_id
    LEFT JOIN trucker tr ON t.trucker_id = tr.trucker_id
    LEFT JOIN dump_facility d ON t.dump_facility_id = d.dump_facility_id
    LEFT JOIN materials m ON t.material_id = m.material_id
    WHERE 1=1
  `;

  const params = [];

  if (start_date) {
    params.push(start_date);
    query += ` AND t.schedule_date >= $${params.length}`;
  }
  if (end_date) {
    params.push(end_date);
    query += ` AND t.schedule_date <= $${params.length}`;
  }
  if (status_id) {
    params.push(status_id);
    query += ` AND t.status_id = $${params.length}`;
  }
  if (job_site_id) {
    params.push(job_site_id);
    query += ` AND t.job_site_id = $${params.length}`;
  }
  if (customer_id) {
    params.push(customer_id);
    query += ` AND t.customer_id = $${params.length}`;
  }
  if (trucker_id) {
    params.push(trucker_id);
    query += ` AND t.trucker_id = $${params.length}`;
  }
  if (dump_facility_id) {
    params.push(dump_facility_id);
    query += ` AND t.dump_facility_id = $${params.length}`;
  }
  if (material_id) {
    params.push(material_id);
    query += ` AND t.material_id = $${params.length}`;
  }

  query += ` ORDER BY t.schedule_date DESC`;

  return { query, params };
};

// GET report JSON data for table view
export const getTasksReport = async (req, res) => {
  try {
    const { query, params } = buildTaskReportQuery(req.query);
    const { rows } = await pool.query(query, params);

    res.json({ tasks: rows });
  } catch (err) {
    console.error("Get Tasks Report Error:", err.message);
    res.status(500).json({ error: "Server Error" });
  }
};

// GET Excel file export
export const exportTasksToExcel = async (req, res) => {
  try {
    const { query, params } = buildTaskReportQuery(req.query);
    const { rows } = await pool.query(query, params);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Task Report');

    // Define Excel Columns
    worksheet.columns = [
      { header: 'Task ID', key: 'task_id', width: 10 },
      { header: 'Status', key: 'status_name', width: 15 },
      { header: 'Schedule Date', key: 'schedule_date', width: 15 },
      { header: 'Job Site', key: 'job_site_name', width: 22 },
      { header: 'Customer', key: 'customer_name', width: 22 },
      { header: 'Trucker', key: 'trucker_name', width: 22 },
      { header: 'Dump Facility', key: 'dump_facility_name', width: 22 },
      { header: 'Material', key: 'material_name', width: 18 },
      { header: 'Loads', key: 'loads', width: 10 },
      { header: 'Actual Loads', key: 'actual_loads', width: 14 },
      { header: 'Invoice', key: 'invoice', width: 18 }
    ];

    // Populate rows
    rows.forEach((task) => worksheet.addRow(task));

    // Style Header Row
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '2D3E50' }
    };

    // Set Response Headers for File Download
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Task_Report_${new Date().toISOString().slice(0, 10)}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Export Tasks Excel Error:", err.message);
    res.status(500).json({ error: "Failed to export report" });
  }
};