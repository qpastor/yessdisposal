import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import authRoutes from './routes/auth.js'; // Ensure the .js extension is here
import cookieParser from 'cookie-parser';

dotenv.config();
const app = express();

app.use(cookieParser());
app.use(express.json());

const allowedOrigins = [
    'http://localhost:5173', 
    'https://yess-disposal-client.onrender.com'
];

// app.use(cors({
//     origin: process.env.FRONTEND_URL || 'http://localhost:5173',
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'DELETE','OPTIONS'],
//     exposedHeaders: ['set-cookie']
//     // allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
// }));

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['set-cookie']
}));

// Auth Routes
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server on ${PORT}`));