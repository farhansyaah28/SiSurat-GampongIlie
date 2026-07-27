require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const jenisRoutes = require('./routes/jenis');
const pengajuanRoutes = require('./routes/pengajuan');
const usersRoutes = require('./routes/users');
const auditRoutes = require('./routes/audit');
const limiter = require('./middleware/rateLimiter');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./openapi.json');

const app = express();

// Middlewares
app.use(cors());
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  next();
});
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(morgan('dev'));
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  frameguard: false,
  xDownloadOptions: false
}));
app.use(limiter);

// Static uploads
const uploadsDir = process.env.VERCEL ? path.join('/tmp', 'uploads') : path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jenis-surat', jenisRoutes);
app.use('/api/pengajuan', pengajuanRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/realtime', require('./routes/realtime'));

// API docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Serve frontend static files
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));
// Serve index.html for non-API routes (SPA)
app.get('*', (req, res, next) => {
	if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
	res.sendFile(path.join(frontendPath, 'index.html'));
});

// Error handler
app.use(errorHandler);

module.exports = app;
