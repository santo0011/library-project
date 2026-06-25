import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';


export const securityMiddleware = [
  helmet(),
  // cors({ origin: env.clientUrl.split(','), credentials: true }),
  cors({ origin: 'http://10.13.219.98:5173'.split(','), credentials: true }),
  cookieParser(env.cookieSecret),
  rateLimit({
    windowMs: env.rateLimitWindowMs,
    max: env.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false
  })
];
