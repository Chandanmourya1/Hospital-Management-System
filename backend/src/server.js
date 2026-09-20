import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import connectDB from './config/db.js';
import errorHandler from './middleware/error.js';
import authRoutes from './routes/authRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import opdRoutes from './routes/opdRoutes.js';
import ipdRoutes from './routes/ipdRoutes.js';
import emrRoutes from './routes/emrRoutes.js';
import pharmacyRoutes from './routes/pharmacyRoutes.js';
import labRoutes from './routes/labRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Enable CORS
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(null, origin);
    },
    credentials: true,
  })
);

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Root welcome & API status route
app.get('/', (req, res) => {
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>MedCare HMS - API Server</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
        body { background: #0f172a; color: #f8fafc; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
        .card { background: #1e293b; border: 1px solid #334155; border-radius: 24px; max-width: 580px; width: 100%; padding: 36px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
        .badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); font-size: 12px; font-weight: 700; text-transform: uppercase; padding: 6px 14px; border-radius: 9999px; margin-bottom: 20px; }
        .dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.2); } }
        h1 { font-size: 26px; font-weight: 800; margin-bottom: 8px; color: #ffffff; }
        p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
        .btn { display: inline-flex; align-items: center; justify-content: center; width: 100%; background: linear-gradient(135deg, #0284c7, #2563eb); color: #fff; font-weight: 700; text-decoration: none; padding: 14px 20px; border-radius: 14px; font-size: 14px; margin-bottom: 20px; transition: transform 0.2s; box-shadow: 0 10px 15px -3px rgba(2, 132, 199, 0.3); }
        .btn:hover { transform: translateY(-1px); }
        .endpoints { background: #0f172a; border: 1px solid #334155; border-radius: 14px; padding: 16px; }
        .endpoints h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 800; margin-bottom: 10px; }
        .endpoints ul { list-style: none; font-size: 12px; font-family: monospace; color: #38bdf8; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
        .endpoints li a { color: #38bdf8; text-decoration: none; }
        .endpoints li a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="badge"><span class="dot"></span> Backend API Running (Port 5000)</div>
        <h1>MedCare Hospital Management System</h1>
        <p>
          The Node.js Express REST API backend is active and connected to MongoDB.
          To view and interact with the hospital web application, open the frontend portal:
        </p>
        <a href="http://localhost:5173" class="btn">🚀 Open Frontend Application (http://localhost:5173)</a>
        <div class="endpoints">
          <h3>Available REST Endpoints</h3>
          <ul>
            <li><a href="/api/health">/api/health</a></li>
            <li><a href="/api/v1/auth/test/admin-only">/api/v1/auth</a></li>
            <li>/api/v1/patients</li>
            <li>/api/v1/doctors</li>
            <li>/api/v1/appointments</li>
            <li>/api/v1/opd</li>
            <li><a href="/api/v1/ipd/beds/matrix">/api/v1/ipd</a></li>
            <li>/api/v1/emr</li>
          </ul>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    system: 'Hospital Management System API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Serve uploaded static files (EMR test reports, scans, documents)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/doctors', doctorRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/opd', opdRoutes);
app.use('/api/v1/ipd', ipdRoutes);
app.use('/api/v1/emr', emrRoutes);
app.use('/api/v1/pharmacy', pharmacyRoutes);
app.use('/api/v1/lab', labRoutes);

// Serve frontend production build if available in production mode
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api') || req.url.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.resolve(frontendDistPath, 'index.html'));
  });
}

// Global Error Handler Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🏥 HMS Backend API running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`🚀 Server listening on: http://localhost:${PORT}`);
  console.log(`📌 Health check:        http://localhost:${PORT}/api/health`);
  console.log(`======================================================\n`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`[Unhandled Rejection]: ${err.message}`);
  // Do not crash server in dev
});
