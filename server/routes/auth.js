import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from "../config/db.js";
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import ExcelJS from 'exceljs';
import rateLimit from 'express-rate-limit';
const router = express.Router();

const isProduction = process.env.NODE_ENV === 'production';

// // PRODUCTION SETUP
const cookieOptions = {
    httpOnly: true,
    secure: true, // Set to true in production
    sameSite: 'none',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
    domain: isProduction ? '.yessdisposal.com' : 'localhost'
};

// DEVELOPMENTE SETUP
// const cookieOptions = {
//     httpOnly: true,
//     secure: isProduction, // Set to true in production
//     sameSite: isProduction ? 'none' : 'lax', 
//     maxAge: 24 * 60 * 60 * 1000,
//     path: '/',
//     domain: isProduction ? '.yessdisposal.com' : 'localhost'
// };

const quoteFormLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15-minute window
    max: 3, // Limit each IP to 2 form submissions per window
    message: { 
        error: "Too many requests", 
        message: "You have submitted too many requests. Please try again after 15 minutes." 
    },
    standardHeaders: true, // Returns rate limit info in the headers
    legacyHeaders: false,  // Disables X-RateLimit-* headers
});

router.all('/healthcheck', async (req, res) => {
    try {
        // Keeps the pool warm safely using the direct pool interface
        await pool.query('SELECT 1;');
        
        res.status(200).json({
            status: 'success',
            message: 'Server and Database are active',
            timestamp: new Date()
        });
    } catch (err) {
        console.error('Healthcheck failed:', err.message);
            res.status(500).json({
            status: 'error',
            message: 'Database connection failed',
            details: err.message
        });
    }
});

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { 
        expiresIn: '30d'
    });
}

// Request Registration
router.post('/request-sent', quoteFormLimiter, async (req, res) => {
    try {
        // 1. Destructure the fields from the request body
        const { 
            fullname,
            email,
            phone,
            project_details
        } = req.body;

        // 2. Insert into the database
        const newTask = await pool.query(
            `INSERT INTO requests (fullname, email, phone, project_details) 
             VALUES($1, $2, $3, $4) 
             RETURNING *`,
            [fullname, email, phone, project_details]
        );

        // 3. Return the newly created task
        res.status(201).json(newTask.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// User Registration
router.post('/user-register', protect, adminOnly, async (req, res) => {
    const { username, name, email, password, role_id } = req.body;
    try {
        const userExists = await pool.query("SELECT * FROM users WHERE username = $1", [username]);

        if(userExists.rows.length > 0){
            return res.status(400).json({ error: "user already exists" });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = await pool.query(
            "INSERT INTO users (username, name, email ,password, role_id) VALUES($1, $2, $3, $4, $5) RETURNING *",
            [username, name, email, hashedPassword, role_id]
        );

        res.json(newUser.rows[0]);
    } catch(err){
        console.error(err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }  
});

router.put('/change-password', protect, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        // Grab the logged-in user id parsed dynamically by your 'protect' middleware
        const userId = req.user?.id || req.user?.userid; 

        if (!userId) {
            return res.status(401).json({ error: "Not authorized, user reference missing." });
        }

        // 1. Fetch user from database to check the current password string
        const userResult = await pool.query('SELECT password FROM users WHERE userid = $1', [userId]);
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: "User not found." });
        }

        const user = userResult.rows[0];

        // 2. Compare incoming current password input with the hashed DB entry using bcryptjs
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Incorrect current password." });
        }

        // 3. Hash the new password safely
        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        // 4. Update the record column in the database
        await pool.query(
            'UPDATE users SET password = $1 WHERE userid = $2',
            [hashedNewPassword, userId]
        );

        res.status(200).json({ message: "Password updated successfully." });

    } catch (err) {
        console.error("❌ Password Reset Error:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get('/tasks/export-excel', protect, adminOnly, async (req, res) => {
  try {
    // 1. Run the query using your imported connection pool
    const queryText = 'SELECT t.*, s.status_name FROM tasks t JOIN status s ON t.status_id = s.status_id';
    const result = await pool.query(queryText); 
    
    // 2. Extract rows from the pg Result object
    const tasks = result.rows; 

    // 3. Initialize ExcelJS structure
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Masterlist');

    // 4. Map columns directly to your database schema fields
    worksheet.columns = [
      { header: 'Task ID', key: 'task_id', width: 10 },
      { header: 'Job Site', key: 'job_site', width: 30},
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

    // 5. Cleanly format timestamp fields for clean cell rendering
    const formattedRows = tasks.map(task => ({
      ...task,
      created_at: task.created_at ? new Date(task.created_at).toLocaleDateString() : '',
      schedule_date: task.schedule_date ? new Date(task.schedule_date).toLocaleDateString() : '',
      completed_date: task.completed_date ? new Date(task.completed_date).toLocaleDateString() : 'N/A'
    }));

    // 6. Push rows into spreadsheet layout instance
    worksheet.addRows(formattedRows);

    // 7. Styling header cells (#2D3E50 layout background color)
    const headerRow = worksheet.getRow(1);
    headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '2D3E50' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // 8. Output headers and stream write response chunks
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Masterlist.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('❌ Excel Export Error Details:', error);
    res.status(500).send('Export failed');
  }
});

//Get Users for Export
router.get('/users/export-excel', protect, adminOnly,async (req, res) => {
  try {
    // 1. Fetch user data (Adjust table/column names to match your DB schema)
    const queryText = `
      SELECT 
        u.userid, 
        u.name,
        u.username,
        u.email, 
        r.role_name,
        u.isactive 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.role_id
      ORDER BY u.userid ASC
    `;
    const result = await pool.query(queryText); 
    const users = result.rows; 

    // 2. Initialize ExcelJS Workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Users List');

    // 3. Define Columns
    worksheet.columns = [
      { header: 'User ID', key: 'userid', width: 10 },
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Username', key: 'username', width: 20 },
      { header: 'Email Address', key: 'email', width: 30 },
      { header: 'Role', key: 'role_name', width: 20 },
      { header: 'Status', key: 'status_label', width: 15 }
    ];

    // 4. Format rows safely before inserting
    const formattedRows = users.map(user => ({
      ...user,
      // Map boolean or flag status to human-readable strings
      status_label: user.isactive ? 'Active' : 'Inactive'
    }));

    // 5. Add rows to worksheet
    worksheet.addRows(formattedRows);

    // 6. Style Headers (#2D3E50 to match your UI layout)
    const headerRow = worksheet.getRow(1);
    headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '2D3E50' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // 7. Set HTTP response headers for Excel streaming
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Yess-Users-List.xlsx');

    // 8. Stream the workbook directly into the response object
    return await workbook.xlsx.write(res);

  } catch (error) {
    console.error('❌ User Excel Export Error Details:', error);
    
    // Safety check: Don't try to send response if headers have already fired
    if (!res.headersSent) {
      res.status(500).send('Export failed');
    }
  }
});

//Get All Users
router.get('/users', protect, adminOnly, async (req, res) => {
    try {
        const queryText = `
            SELECT 
                u.userid, 
                u.name, 
                u.username, 
                u.email, 
                u.isactive, 
                r.role_name 
            FROM users u 
            LEFT JOIN roles r ON u.role_id = r.role_id
        `;
        
        const result = await pool.query(queryText);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

//Get Roles for Dropdown
router.get('/roles', async (req, res) => {
  try {
    const result = await pool.query('SELECT role_id, role_name FROM roles ORDER BY role_name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});



//Get Status for Dropdown
router.get('/statuses', async (req, res) => {
  try {
    const result = await pool.query('SELECT status_id, status_name FROM status ORDER BY status_id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

//Get Specific Users
router.get('/users/:userid', protect,async (req, res) => {
    try {
        const { userid } = req.params;
        const queryText = `
            SELECT 
                u.userid, 
                u.name, 
                u.username, 
                u.email, 
                u.isactive,
                u.role_id,
                r.role_name 
            FROM users u 
            LEFT JOIN roles r ON u.role_id = r.role_id
            WHERE u.userid = $1
        `;

        const result = await pool.query(queryText, [userid]);
        // Check if a user was actually found
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        // Return the first object instead of the whole array for a single user fetch
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

//Update User
router.put('/users/:userid', protect, adminOnly, async (req, res) => {
    try {
        const { userid } = req.params;
        const { name, username, email, isactive, role_id } = req.body;
        const cleanRoleId = role_id ? parseInt(role_id) : null;
        const finalIsActive = isactive === true || isactive === 'true' || isactive === 1;

        const updateResult = await pool.query(
            "UPDATE users SET name = $1, username = $2, email = $3, isactive = $4, role_id = $5 WHERE userid = $6 RETURNING *",
            [name, username, email, finalIsActive, cleanRoleId, parseInt(userid)]
        );

        if (updateResult.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const fullUserQuery = `
            SELECT u.userid, u.name, u.username, u.email, u.isactive, u.role_id, r.role_name 
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.role_id
            WHERE u.userid = $1
        `;
        const finalResult = await pool.query(fullUserQuery, [userid]);

        res.json(finalResult.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


// Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const userExists = await pool.query("SELECT u.*,r.role_name FROM users u LEFT JOIN roles r ON u.role_id = r.role_id WHERE u.username = $1", [username]);

        if (userExists.rows.length === 1) {
            const user = userExists.rows[0];
            const isMatch = await bcrypt.compare(password, user.password);
            
            if (isMatch) {
                if (user.isactive === false) {
                    return res.status(403).json({ error: "Your account has been deactivated. Please contact an administrator." });
                }
                
                // 1. Generate the token
                const token = generateToken(user.userid);
                
                // 2. Send successful response with token
                return res.json({ 
                    message: "Login successful", 
                    user: user,
                    token: token 
                });
            } else {
                // 🌟 FIX 1: This handles when username matches but password is WRONG
                return res.status(401).json({ error: "Incorrect username or password." });
            }
        } else {
            // This handles when username does NOT exist in DB
            return res.status(401).json({ error: "Incorrect username or password." });
        }
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});


router.post('/logout', (req, res) => {
    const { maxAge, ...logoutOptions } = cookieOptions; // Remove maxAge
    res.cookie('yess_session', '', {
        ...logoutOptions,
        expires: new Date(0), 
    });
    res.status(200).json({ message: "Logged out successfully" });
});

// Task Registration
router.post('/task-register', protect, adminOnly, async (req, res) => {
    try {
        // 1. Destructure the fields from the request body
        const { 
            status_id,
            job_site, 
            customer, 
            loads, 
            material, 
            trucker, 
            dump_facility,
            schedule_date,
            invoice,
            actual_loads,
            trucker_invoice,
            dump_facility_invoice,
            remarks
        } = req.body;
        // 2. Insert into the database
        const newTask = await pool.query(
            `INSERT INTO tasks (status_id, job_site, customer, loads, material, trucker, dump_facility, schedule_date, invoice, actual_loads, trucker_invoice, dump_facility_invoice, remarks, created_at) 
             VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW()) 
             RETURNING *`,
            [status_id, job_site, customer, loads, material, trucker, dump_facility, schedule_date, invoice, actual_loads, trucker_invoice, dump_facility_invoice, remarks]
        );

        // 3. Return the newly created task
        res.status(201).json(newTask.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get('/tasks', protect, async (req, res) => {
    const { status } = req.query;
    
    // Check if the frontend specifically asked for pagination parameters
    const hasPagination = req.query.page && req.query.limit;
    
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    try {
        let tasksQuery = `
            SELECT t.*, s.status_name 
            FROM tasks t 
            JOIN status s ON t.status_id = s.status_id
        `;
        
        let countQuery = `
            SELECT COUNT(*) 
            FROM tasks t 
            JOIN status s ON t.status_id = s.status_id
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

        // 2. ONLY apply LIMIT and OFFSET if pagination parameters were provided
        if (hasPagination) {
            tasksQuery += ` ORDER BY t.created_at DESC LIMIT $${dataParams.length + 1} OFFSET $${dataParams.length + 2}`;
            dataParams.push(limit, offset);
        } else {
            // MasterList or any client requesting everything gets all data sorted
            tasksQuery += ` ORDER BY t.created_at DESC`;
        }

        const allTasks = await pool.query(tasksQuery, dataParams);
        const totalPages = hasPagination ? Math.ceil(totalTasks / limit) : 1;

        // 3. Return the exact structure both files can digest smoothly
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
});

// Get all Status of Tasks for Dashboard
router.get('/stats', async (req, res) => {
  try {
    const result = await pool.query('SELECT s.status_name, COUNT(t.task_id) as count FROM status s LEFT JOIN tasks t ON s.status_id = t.status_id GROUP BY s.status_name;');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});




// GET a specific task by ID
router.get('/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const task = await pool.query(
            'SELECT t.*,s.status_name FROM tasks t LEFT JOIN status s ON t.status_id = s.status_id WHERE task_id = $1', 
            [id]
        );

        if (task.rows.length === 0) {
            return res.status(404).json({ error: "Task not found" });
        }

        res.json(task.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// UPDATE a specific task by ID
router.put('/tasks/:id', protect, adminOnly, async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            job_site, 
            customer, 
            loads, 
            material, 
            trucker, 
            dump_facility,
            schedule_date,
            invoice,
            completed_date,
            actual_loads,
            status_id,
            trucker_invoice,
            dump_facility_invoice,
            remarks

        } = req.body;

        const cleanDate = (date) => (date === "" || date === undefined) ? null : date;
        const cleanNum = (num) => (num === "" || num === undefined) ? null : num;
        const task = await pool.query(
            `UPDATE tasks SET job_site = $1, customer = $2, loads = $3, material = $4, trucker = $5, dump_facility = $6, schedule_date = $7, invoice = $8, completed_date = $9, actual_loads = $10, status_id = $11, trucker_invoice = $12, dump_facility_invoice = $13, remarks = $14 WHERE task_id = $15 RETURNING *`, 
            [job_site, customer, cleanNum(loads), material, trucker, dump_facility, cleanDate(schedule_date), cleanNum(invoice), cleanDate(completed_date), cleanNum(actual_loads), status_id, trucker_invoice, dump_facility_invoice, remarks, id]
        );

        if (task.rows.length === 0) {
            return res.status(404).json({ error: "Task not found" });
        }

        res.json(task.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

//Disable a specific user by ID
router.put('/users/:id/disable', protect, adminOnly, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await pool.query(
            "UPDATE users SET isactive = false WHERE userid = $1 RETURNING *",
            [id]
        );

        if (user.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(user.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// DELETE a specific task
router.delete('/tasks/:id', protect, adminOnly,async (req, res) => {
    try {
        const { id } = req.params;
        const deleteResult = await pool.query(
            "DELETE FROM tasks WHERE task_id = $1", 
            [id]
        );

        if (deleteResult.rowCount === 0) {
            return res.status(404).json({ error: "Task not found" });
        }

        res.json({ message: "Task was deleted!" });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

//Get All Requests List
router.get('/requests', async (req, res) => {
    try {
        const queryText = `
            SELECT * FROM requests`;
        const result = await pool.query(queryText);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get('/requests/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const request = await pool.query(
            'SELECT * FROM requests WHERE request_id = $1',
            [id]
        );

        if (request.rows.length === 0) {
            return res.status(404).json({ error: "Request not found" });
        }

        res.json(request.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.put('/requests/:id', async (req, res) => {
    const { id } = req.params;
    const { contacted } = req.body;

    try {
        // Only update 'contacted', as customer details (name, email, etc.) are read-only text elements
        const updateQuery = `
            UPDATE requests
            SET 
                contacted = $1,
                updated_at = NOW()
            WHERE request_id = $2
            RETURNING *;
        `;

        // Coerce input values safely into true/false states
        const values = [
            contacted ?? false, 
            id
        ];

        const result = await pool.query(updateQuery, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Request entry not found." });
        }

        // Send back the updated database object row to React
        res.json(result.rows[0]);

    } catch (err) {
        console.error("❌ Database update failure inside PUT /api/auth/requests:", err.message);
        res.status(500).json({ error: "Failed to update data records." });
    }
});



export default router;