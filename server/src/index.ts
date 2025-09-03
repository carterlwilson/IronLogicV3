import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDB, getConnectionStatus, getDatabaseStats } from './config/database';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import gymRoutes from './routes/gyms';
import activityRoutes from './routes/activities';
import { activityGroupsRouter } from './routes/activityGroups';
import benchmarkTemplateRoutes from './routes/benchmarkTemplates';
import workoutProgramRoutes from './routes/workoutPrograms';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth-specific rate limiting (more restrictive)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 auth requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting
app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

app.get('/health', async (_req, res) => {
  try {
    const dbStatus = getConnectionStatus();
    const timestamp = new Date().toISOString();
    
    // Basic health check
    const healthCheck: any = {
      status: 'OK',
      timestamp,
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: dbStatus.state,
        connected: dbStatus.state === 'connected'
      }
    };

    // If database is connected, add more detailed stats
    if (dbStatus.state === 'connected') {
      try {
        const dbStats = await getDatabaseStats();
        healthCheck.database = {
          ...healthCheck.database,
          host: dbStatus.host,
          port: dbStatus.port,
          name: dbStatus.name,
          uptime: dbStats.uptime,
          version: dbStats.version,
          connections: dbStats.connections
        };
      } catch (error) {
        healthCheck.database = {
          ...healthCheck.database,
          statsError: 'Unable to retrieve database statistics'
        };
      }
    }

    // Return 200 if basic services are up, 503 if database is down
    const status = dbStatus.state === 'connected' ? 200 : 503;
    res.status(status).json(healthCheck);
    
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      database: {
        status: 'error',
        connected: false
      }
    });
  }
});

app.get('/api/status', (_req, res) => {
  res.status(200).json({ 
    message: 'IronLogic3 API is running',
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/gyms', gymRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/activity-groups', activityGroupsRouter);
app.use('/api/benchmark-templates', benchmarkTemplateRoutes);
app.use('/api/workout-programs', workoutProgramRoutes);

app.use('*', (_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const startServer = async () => {
  try {
    // Connect to database first
    await connectDB();
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 IronLogic3 server running on port ${PORT}`);
      console.log(`📊 Health check available at http://localhost:${PORT}/health`);
      console.log(`🔌 API status at http://localhost:${PORT}/api/status`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();