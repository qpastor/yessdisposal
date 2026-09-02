import ExcelJS from 'exceljs';
import pool from '../config/db.js';

// -------------------------------------------------------------
// REGISTER / CREATE TASK
// -------------------------------------------------------------
export const createTask = async (req, res) => {
    const { 
        status_id, 
        schedule_date, 
        job_site_id, 
        customer_id, 
        loads, 
        material_id, 
        trucker_id, 
        dump_facility_id, 
        remarks 
    } = req.body;

    // Simple validation
    if (!material_id) {
        return res.status(400).json({ error: "Material field selection is required." });
    }

    try {
        const taskInsertQuery = `
            INSERT INTO tasks (
                status_id, 
                schedule_date, 
                job_site_id, 
                customer_id, 
                loads, 
                material_id, 
                trucker_id, 
                dump_facility_id, 
                remarks
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
            RETURNING *;
        `;

        const taskValues = [
            status_id, 
            schedule_date, 
            job_site_id, 
            customer_id, 
            loads, 
            material_id, 
            trucker_id, 
            dump_facility_id, 
            remarks
        ];

        const taskResult = await pool.query(taskInsertQuery, taskValues);

        res.status(201).json({ 
            message: "Task registered successfully", 
            task: taskResult.rows[0] 
        });

    } catch (error) {
        console.error("Database Insertion Error:", error.message);
        res.status(500).json({ error: "Internal server error saving task pipeline." });
    }
};

// -------------------------------------------------------------
// GET ALL TASKS (With optional status filter & pagination)
// -------------------------------------------------------------
export const getAllTasks = async (req, res) => {
    const { status } = req.query;
    
    const hasPagination = req.query.page && req.query.limit;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    try {
        let tasksQuery = `
            SELECT 
                t.*, 
                s.status_name,
                c.customer_name,
                j.job_site_name,
                tr.trucker_name,
                df.dump_facility_name,
                m.material_name
            FROM tasks t 
            JOIN status s ON t.status_id = s.status_id
            LEFT JOIN customers c ON c.customer_id = t.customer_id
            LEFT JOIN job_sites j ON j.job_site_id = t.job_site_id
            LEFT JOIN trucker tr ON tr.trucker_id = t.trucker_id
            LEFT JOIN dump_facility df ON df.dump_facility_id = t.dump_facility_id
            LEFT JOIN materials m ON m.material_id = t.material_id
        `;
        
        let countQuery = `
            SELECT COUNT(*) 
            FROM tasks t 
            JOIN status s ON t.status_id = s.status_id
            LEFT JOIN customers c ON c.customer_id = t.customer_id
            LEFT JOIN job_sites j ON j.job_site_id = t.job_site_id
            LEFT JOIN trucker tr ON tr.trucker_id = t.trucker_id
            LEFT JOIN dump_facility df ON df.dump_facility_id = t.dump_facility_id
            LEFT JOIN materials m ON m.material_id = t.material_id
        `;

        let dataParams = [];
        let countParams = [];

        if (status) {
            tasksQuery += ` WHERE s.status_name = $1`;
            countQuery += ` WHERE s.status_name = $1`;
            dataParams.push(status);
            countParams.push(status);
        }

        // 1. Get the total matching count
        const totalCountResult = await pool.query(countQuery, countParams);
        const totalTasks = parseInt(totalCountResult.rows[0].count, 10);

        const orderClause = ` ORDER BY t.schedule_date DESC, t.task_id DESC`;

        // 2. Apply LIMIT and OFFSET if pagination parameters exist
        if (hasPagination) {
            tasksQuery += orderClause + ` LIMIT $${dataParams.length + 1} OFFSET $${dataParams.length + 2}`;
            dataParams.push(limit, offset);
        } else {
            tasksQuery += orderClause;
        }

        const allTasks = await pool.query(tasksQuery, dataParams);
        const totalPages = hasPagination ? Math.ceil(totalTasks / limit) : 1;

        res.json({
            tasks: allTasks.rows,
            totalTasks,
            totalPages,
            currentPage: page
        });

    } catch (err) {
        console.error("Backend Error:", err.message);
        res.status(500).json({ error: err.message });
    }
};

// -------------------------------------------------------------
// GET SINGLE TASK BY ID
// -------------------------------------------------------------
export const getTaskById = async (req, res) => {
    try {
        const { id } = req.params;
        const task = await pool.query(
            `SELECT 
                t.*, 
                s.status_name,
                c.customer_name,
                j.job_site_name,
                tr.trucker_name,
                df.dump_facility_name,
                m.material_name
            FROM tasks t 
            JOIN status s ON t.status_id = s.status_id
            LEFT JOIN customers c ON c.customer_id = t.customer_id
            LEFT JOIN job_sites j ON j.job_site_id = t.job_site_id
            LEFT JOIN trucker tr ON tr.trucker_id = t.trucker_id
            LEFT JOIN dump_facility df ON df.dump_facility_id = t.dump_facility_id
            LEFT JOIN materials m ON m.material_id = t.material_id 
            WHERE t.task_id = $1`, 
            [id]
        );

        if (task.rows.length === 0) {
            return res.status(404).json({ error: "Task not found" });
        }

        res.json(task.rows[0]);
    } catch (err) {
        console.error("Get Task Error:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// -------------------------------------------------------------
// UPDATE TASK BY ID
// -------------------------------------------------------------
export const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            status_id,
            schedule_date,
            job_site_id,
            customer_id,
            loads,
            material_id,
            trucker_id,
            dump_facility_id,
            remarks,
            invoice,
            completed_date,
            actual_loads,
            trucker_invoice,
            dump_facility_invoice,
        } = req.body;

        const updateQuery = `
            UPDATE tasks 
            SET 
                status_id = $1,
                schedule_date = $2,
                job_site_id = $3,
                customer_id = $4,
                loads = $5,
                material_id = $6,
                trucker_id = $7,
                dump_facility_id = $8,
                remarks = $9,
                invoice = $10,
                completed_date = $11,
                actual_loads = $12,
                trucker_invoice = $13,
                dump_facility_invoice = $14
            WHERE task_id = $15
            RETURNING *;
        `;

        const values = [
            status_id,
            schedule_date,
            job_site_id,
            customer_id,
            loads,
            material_id,
            trucker_id,
            dump_facility_id,
            remarks,
            invoice,
            completed_date,
            actual_loads,
            trucker_invoice,
            dump_facility_invoice,
            id,
        ];

        const updateResult = await pool.query(updateQuery, values);

        if (updateResult.rowCount === 0) {
            return res.status(404).json({ error: "Task not found" });
        }

        res.json({
            message: "Task was updated successfully!",
            task: updateResult.rows[0],
        });
    } catch (err) {
        console.error("Update Task Error:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// -------------------------------------------------------------
// EXPORT TASKS TO EXCEL
// -------------------------------------------------------------
export const exportTasksToExcel = async (req, res) => {
    try {
        const queryText = 'SELECT t.*, s.status_name FROM tasks t JOIN status s ON t.status_id = s.status_id';
        const result = await pool.query(queryText); 
        const tasks = result.rows; 

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Masterlist');

        worksheet.columns = [
            { header: 'Task ID', key: 'task_id', width: 10 },
            { header: 'Job Site', key: 'job_site', width: 30 },
            { header: 'Customer', key: 'customer', width: 30 },
            { header: 'Load', key: 'loads', width: 15 }, 
            { header: 'Material Type', key: 'material', width: 30 },
            { header: 'Trucker', key: 'trucker', width: 20 },
            { header: 'Dump Facility', key: 'dump_facility', width: 25 },
            { header: 'Created At', key: 'created_at', width: 20 },
            { header: 'Scheduled Date', key: 'schedule_date', width: 20 }, 
            { header: 'Completed Date', key: 'completed_date', width: 20 },
            { header: 'Actual Loads', key: 'actual_loads', width: 15 },
            { header: 'Dump Facility Invoice', key: 'dump_facility_invoice', width: 25 },
            { header: 'Yess Invoice', key: 'invoice', width: 20 }, 
            { header: 'Status', key: 'status_name', width: 20 },
            { header: 'Remarks', key: 'remarks', width: 40 } 
        ];

        const formattedRows = tasks.map(task => ({
            ...task,
            created_at: task.created_at ? new Date(task.created_at).toLocaleDateString() : '',
            schedule_date: task.schedule_date ? new Date(task.schedule_date).toLocaleDateString() : '',
            completed_date: task.completed_date ? new Date(task.completed_date).toLocaleDateString() : 'N/A'
        }));

        worksheet.addRows(formattedRows);

        const headerRow = worksheet.getRow(1);
        headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '2D3E50' }
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Masterlist.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('❌ Excel Export Error Details:', error);
        res.status(500).send('Export failed');
    }
};

export const getTasksByStatus = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const parsedPage = Math.max(1, parseInt(page, 10));
    const parsedLimit = Math.max(1, parseInt(limit, 10));
    const offset = (parsedPage - 1) * parsedLimit;

    let whereConditions = [];
    let queryParams = [];

    // URL parameter handling for statuses like "Facility + Trucking Bill Received"
    if (status && status.trim() !== '') {
      queryParams.push(decodeURIComponent(status).trim());
      whereConditions.push(`LOWER(s.status_name) = LOWER($${queryParams.length})`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 1. Total Count Query for Pagination
    const countQuery = `
      SELECT COUNT(t.task_id) AS total
      FROM tasks t
      LEFT JOIN status s ON t.status_id = s.status_id
      ${whereClause}
    `;
    const countResult = await db.query(countQuery, queryParams);
    const totalTasks = parseInt(countResult.rows ? countResult.rows[0].total : countResult[0][0].total, 10) || 0;
    const totalPages = Math.ceil(totalTasks / parsedLimit) || 1;

    // 2. Data Fetch Query with corrected Foreign Keys
    const dataQueryParams = [...queryParams, parsedLimit, offset];
    const dataQuery = `
      SELECT 
        t.task_id,
        t.status_id,
        s.status_name,
        t.schedule_date,
        t.job_site_id,
        j.job_site_name,
        t.customer_id,
        c.customer_name,
        t.loads,
        t.material_id,
        m.material_name,
        t.trucker_id,
        tr.trucker_name,
        t.dump_facility_id,
        df.dump_facility_name,
        t.invoice,
        t.completed_date,
        t.actual_loads,
        t.trucker_invoice,
        t.dump_facility_invoice,
        t.remarks
      FROM tasks t
      LEFT JOIN statuses s ON t.status_id = s.status_id
      LEFT JOIN job_sites j ON t.job_site_id = j.job_site_id
      LEFT JOIN customers c ON t.customer_id = c.customer_id  -- Fixed join condition
      LEFT JOIN materials m ON t.material_id = m.material_id
      LEFT JOIN truckers tr ON t.trucker_id = tr.trucker_id
      LEFT JOIN dump_facilities df ON t.dump_facility_id = df.dump_facility_id
      ${whereClause}
      ORDER BY t.schedule_date DESC, t.task_id DESC
      LIMIT $${dataQueryParams.length - 1} OFFSET $${dataQueryParams.length}
    `;

    const tasksResult = await db.query(dataQuery, dataQueryParams);
    const tasks = tasksResult.rows || tasksResult[0] || [];

    return res.json({
      tasks,
      totalTasks,
      totalPages,
      currentPage: parsedPage
    });
  } catch (err) {
    console.error('Error fetching filtered tasks:', err);
    res.status(500).json({ message: 'Internal server error while retrieving task list.' });
  }
};

export const createJobSite = async (req, res) => {
  try {
    const { job_site_name } = req.body;

    if (!job_site_name) {
      return res.status(400).json({ error: 'Job site name is required' });
    }

    // Replace with your DB query / Prisma / Knex / SQL
    const newJobSite = await pool.query(
      'INSERT INTO job_sites (job_site_name) VALUES ($1) RETURNING *',
      [job_site_name]
    );

    return res.status(201).json(newJobSite.rows[0]);
  } catch (error) {
    console.error('Error creating job site:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};