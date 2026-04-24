import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import pool from "./config/db.js";
import authRoutes from './routes/auth.js'; // Ensure the .js extension is here
import cookieParser from 'cookie-parser';

dotenv.config();
const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE','OPTIONS'],
    exposedHeaders: ['set-cookie']
    // allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
}));

// Auth Routes
app.use('/api/auth', authRoutes);

// --- USER ROUTES ---
app.post('/users', async (req, res) => {
    try {
        const { description } = req.body;
        const newUser = await pool.query(
            "INSERT INTO Users (description) VALUES($1) RETURNING *",
            [description]
        );
        res.json(newUser.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ... (Your other GET, PUT, DELETE /users routes go here)

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server on ${PORT}`));