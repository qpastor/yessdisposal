import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from "../config/db.js";
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

const isProduction = process.env.NODE_ENV === 'production';

const cookieOptions = {
    httpOnly: true,
    secure: isProduction, // Set to true in production
    sameSite: isProduction ? 'none' : 'lax', 
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
    domain: isProduction ? '.yessdisposal.com' : 'localhost'
};

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { 
        expiresIn: '30d'
    });
}

// Task Registration
router.post('/request-sent', async (req, res) => {
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
        const token = generateToken(newUser.rows[0].userid);
        res.cookie('yess_session', token, cookieOptions);
        res.json(newUser.rows[0]);
    } catch(err){
        console.error(err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }  
});

//Get All Users
router.get('/users', async (req, res) => {
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

//Get Specific Users
router.get('/users/:userid', async (req, res) => {
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

// Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const userExists = await pool.query("SELECT u.*,r.role_name FROM users u LEFT JOIN roles r ON u.role_id = r.role_id WHERE u.username = $1", [username]);

        if(userExists.rows.length === 1){
            const isMatch = await bcrypt.compare(password, userExists.rows[0].password);
            if(isMatch){
                const token = generateToken(userExists.rows[0].userid);
                res.cookie('yess_session', token, cookieOptions);
                res.json({ message: "Login successful", user: userExists.rows[0] });
            } else {
                res.status(401).json({ error: "Invalid credentials" });
            }
        } else {
            res.status(401).json({ error: "Invalid credentials" });
        }
    } catch(err){
        console.error(err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Logout Route
router.post('/logout', (req, res) => {
    res.cookie('yess_session', '', {
        ...cookieOptions,
        expires: new Date(0), 
    });
    res.status(200).json({ message: "Logged out successfully" });
});
// router.post('/logout', (req, res) => {
//     res.cookie('yess_session', '', {
//         httpOnly: true,
//         expires: new Date(0), // Sets the expiration date to the past
//         secure: false,
//         //process.env.NODE_ENV === 'production',
//         sameSite: 'lax',
//         path: '/'
//     });
//     res.status(200).json({ message: "Logged out successfully" });
// });

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
            invoice
        } = req.body;

        // 2. Insert into the database
        const newTask = await pool.query(
            `INSERT INTO tasks (status_id, job_site, customer, loads, material, trucker, dump_facility, schedule_date, invoice) 
             VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) 
             RETURNING *`,
            [status_id, job_site, customer, loads, material, trucker, dump_facility, schedule_date, invoice]
        );

        // 3. Return the newly created task
        res.status(201).json(newTask.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get all Tasks List
router.get('/tasks', async (req, res) => {
  try {
    const result = await pool.query('SELECT t.*,s.status_name FROM tasks t LEFT JOIN status s ON t.status_id = s.status_id ORDER BY schedule_date DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send('Server Error');
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
            status_id
        } = req.body;

        const cleanDate = (date) => (date === "" || date === undefined) ? null : date;
        const cleanNum = (num) => (num === "" || num === undefined) ? null : num;
        const task = await pool.query(
            `UPDATE tasks SET job_site = $1, customer = $2, loads = $3, material = $4, trucker = $5, dump_facility = $6, schedule_date = $7, invoice = $8, completed_date = $9, actual_loads = $10, status_id = $11 WHERE task_id = $12 RETURNING *`, 
            [job_site, customer, cleanNum(loads), material, trucker, dump_facility, cleanDate(schedule_date), cleanNum(invoice), cleanDate(completed_date), cleanNum(actual_loads), status_id, id]
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

export default router;