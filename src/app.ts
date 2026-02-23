import express, { Express, Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { setupSecurity, appointmentRateLimit } from './config/security';
import logger from './utils/logger';
import env from './config/env';

const app: Express = express();

// Security middleware
setupSecurity(app);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// HTTP request logging
app.use(
  pinoHttp({
    logger,
    customLogLevel: (_req, res, err) => {
      if (res.statusCode >= 400 && res.statusCode < 500) {
        return 'warn';
      } else if (res.statusCode >= 500 || err) {
        return 'error';
      }
      return 'info';
    },
  })
);

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// Routes
import authRoutes from './modules/auth/auth.routes';
import barbershopRoutes from './modules/barbershops/barbershop.routes';
import planRoutes from './modules/plans/plan.routes';
import barberRoutes from './modules/barbers/barber.routes';
import serviceRoutes from './modules/services/service.routes';
import appointmentRoutes from './modules/appointments/appointment.routes';
import customerRoutes from './modules/customers/customer.routes';

app.use('/auth', authRoutes);
app.use('/barbershops', barbershopRoutes);
app.use('/plans', planRoutes);
app.use('/barbers', barberRoutes);
app.use('/services', serviceRoutes);
app.use('/appointments', appointmentRoutes);
app.use('/customers', customerRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(err, 'Unhandled error');

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    error: env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

export default app;
export { appointmentRateLimit };

