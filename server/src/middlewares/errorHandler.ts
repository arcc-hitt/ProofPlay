// Description: Middleware to handle errors that captures errors thrown in the application, logs them, and sends a structured response to the client.
import { ErrorRequestHandler } from 'express';
import { isCelebrateError } from 'celebrate';
import logger from '../config/logger';

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  // Handle Celebrate (validation) errors
  if (isCelebrateError(err)) {
    const details = Array.from(err.details.values())[0]
      .details.map(d => d.message)
      .join(', ');
    res.status(400).json({ error: 'Validation error', details });
    return;
  }

  // Log and send generic errors
  logger.error('Unhandled error', err);
  const status = err.statusCode ?? 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ error: message });
  return;
};

export default errorHandler;