// Description: Logger configuration using Winston
import { createLogger, transports, format } from 'winston';

export default createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console(),
    // add file transports if desired
  ],
});
