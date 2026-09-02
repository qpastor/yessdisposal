import jwt from 'jsonwebtoken';
import pool from "../config/db.js";

export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ error: "Not authorized, no token attached" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        
        const userResult = await pool.query(
            "SELECT u.userid, u.role_id, r.role_name FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.userid = $1", 
            [decoded.id]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: "User not found" });
        }

        req.user = userResult.rows[0];
        next();
    } catch (error) {
        console.error("Token verification failed:", error.message);
        
        // Pass a specific message if token is expired so the mobile app triggers refresh logic
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: "Token expired", code: "TOKEN_EXPIRED" });
        }
        
        res.status(401).json({ error: "Not authorized, token failed" });
    }
};

export const adminOnly = (req, res, next) => {
    if (req.user && req.user.role_id === 1) {
        next();
    } else {
        res.status(403).json({ error: "Access denied. Admins only." });
    }
};