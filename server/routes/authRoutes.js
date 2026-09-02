import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from "../config/db.js";
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import ExcelJS from 'exceljs';
import rateLimit from 'express-rate-limit';
const router = express.Router();
import * as authController from '../controller/authController.js';
import * as lookupController from '../controller/lookupController.js';
import * as requestController from '../controller/requestController.js';
import * as taskController from '../controller/taskController.js';
import * as userController from '../controller/userController.js';
import * as reportController from '../controller/reportController.js';
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

console.log('protect middleware:', protect);
console.log('createJobSite handler:', taskController?.createJobSite);

// DEVELOPMENTE SETUP
// const cookieOptions = {
//     httpOnly: true,
//     secure: isProduction, // Set to true in production
//     sameSite: isProduction ? 'none' : 'lax', 
//     maxAge: 24 * 60 * 60 * 1000,
//     path: '/',
//     domain: isProduction ? '.yessdisposal.com' : 'localhost'
// };


//**My Account Related Routes **
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

// ** Other Routes **
// Get all Missing Invoice for Dashboard
router.get('/missing-invoices', async (req, res) => {
  try {
    const query = `
      SELECT 
        COUNT(CASE WHEN t.invoice IS NULL OR t.invoice = '' THEN 1 END) AS no_invoice,
        COUNT(CASE WHEN t.dump_facility_invoice IS NULL OR t.dump_facility_invoice = '' THEN 1 END) AS no_dump,
        COUNT(CASE WHEN t.trucker_invoice IS NULL OR t.trucker_invoice = '' THEN 1 END) AS no_trucker
      FROM tasks t
    `;
    
    // PostgreSQL uses result.rows, do not destructure with [result]
    const result = await pool.query(query); 
    const row = result.rows[0] || { no_invoice: 0, no_dump: 0, no_trucker: 0 };

    // Formatted perfectly to match your exact front-end property keys!
    const formattedStats = {
      no_invoice_count: Number(row.no_invoice),
      no_dump_facility_invoice_count: Number(row.no_dump),
      no_trucker_invoice_count: Number(row.no_trucker)
    };

    res.json(formattedStats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//** authController Routes **/
// New Login
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/profile', protect, authController.getMe);
router.put('/profile/:id', protect, authController.updateProfile);


//** taskController Routes **/
router.post('/task-register', protect, taskController.createTask);
router.get('/tasks', protect, taskController.getAllTasks);
router.get('/tasks/export-excel', protect, taskController.exportTasksToExcel);
router.get('/tasks/:id', protect, taskController.getTaskById);
router.put('/tasks/:id', protect, taskController.updateTask);
router.put('/tasks/status/:id', protect, taskController.getTasksByStatus);
router.post('/tasks/job-sites', protect, taskController.createJobSite);

//router.delete('/tasks/:id', protect, taskController.deleteTask);

//** userController Routes **/
router.post('/user-registration', protect, adminOnly, userController.registerUser);
router.get('/users', protect, adminOnly, userController.getAllUsers);
router.get('/users/export-excel', protect, adminOnly, userController.exportUsersToExcel);
router.get('/users/:userid', protect, userController.getUserById);
router.put('/users/:userid', protect, adminOnly, userController.updateUser);
router.put('/users/enable/:userid', protect, adminOnly, userController.enableUser);
router.put('/users/disable/:userid', protect, adminOnly, userController.disableUser) ;


//** requestController Routes **/
const quoteFormLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: { 
        error: "Too many requests", 
        message: "You have submitted too many requests. Please try again after 15 minutes." 
    },
    standardHeaders: true,
    legacyHeaders: false,
});
router.post('/request-sent', quoteFormLimiter, requestController.createRequest);
router.get('/requests', protect, requestController.getAllRequests);
router.get('/requests/:id', protect, requestController.getRequestById);
router.put('/requests/:id', protect, requestController.updateRequest);

// ** reportController Routes **/
router.get('/reports/tasks', protect, reportController.getTasksReport);
router.get('/reports/tasks/export-excel', protect, reportController.exportTasksToExcel);

//** Lookup Routes **/
router.get('/roles', lookupController.getRoles);
router.get('/statuses', lookupController.getStatuses);
router.get('/job-sites', lookupController.getJobSites);
router.get('/customers', lookupController.getCustomers);
router.get('/truckers', lookupController.getTruckers);
router.get('/materials', lookupController.getMaterials);
router.get('/dump-facilities', lookupController.getDumpFacilities);
router.get('/stats', lookupController.getTaskStats);

export default router;