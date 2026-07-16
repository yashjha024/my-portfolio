/**
 * 404 Not Found API Handler for missing or invalid endpoints.
 */
export const notFoundHandler = (req, res, _next) => {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: [${req.method}] ${req.originalUrl}`,
    code: 'ENDPOINT_NOT_FOUND',
  });
};

/**
 * Global 500 API Error Handler with stack trace redaction in production.
 */
export const errorHandler = (err, req, res, _next) => {
  const statusCode =
    err.code === 'LIMIT_FILE_SIZE' || err.name === 'MulterError'
      ? 400
      : res.statusCode && res.statusCode !== 200
        ? res.statusCode
        : err.status || 500;

  if (process.env.NODE_ENV === 'production') {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message: err.message,
        statusCode,
        url: req.originalUrl,
        method: req.method,
      })
    );
  } else {
    console.error('API Error:', err.stack || err.message);
  }

  res.status(statusCode).json({
    success: false,
    error:
      statusCode === 500 && process.env.NODE_ENV === 'production'
        ? 'Internal Server Error. Our team has been notified.'
        : err.message || 'Internal Server Error',
    code: err.code || `HTTP_${statusCode}`,
    details: err.details,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
