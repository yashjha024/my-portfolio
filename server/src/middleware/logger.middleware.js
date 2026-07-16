/**
 * Production-ready Request & Performance Logging Middleware.
 * Logs structured request telemetry including status code, response duration (ms), IP, and user-agent.
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  const method = req.method;
  const url = req.originalUrl || req.url;
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const logLevel = statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'INFO';

    if (process.env.NODE_ENV === 'production') {
      console.info(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: logLevel,
          method,
          url,
          statusCode,
          durationMs: duration,
          ip,
          userAgent: req.headers['user-agent'] || '',
        })
      );
    } else {
      const color = statusCode >= 500 ? '\x1b[31m' : statusCode >= 400 ? '\x1b[33m' : '\x1b[32m';
      console.info(`[REQ] ${color}${method} ${url} ${statusCode}\x1b[0m - ${duration}ms - ${ip}`);
    }
  });

  next();
};
