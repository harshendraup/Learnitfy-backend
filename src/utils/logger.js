const winston = require('winston');

// Define severity levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Set log level based on environment
const level = () => (process.env.NODE_ENV === 'development' ? 'debug' : 'info');

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};
winston.addColors(colors);

// Format for console (with color)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Format for file (without color)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define transports for logging
const transports = [
  new winston.transports.Console({ format: consoleFormat }), // Color for console
  new winston.transports.File({ filename: 'logs/error.log', level: 'error', format: fileFormat }), // No color for file
  new winston.transports.File({ filename: 'logs/all.log', format: fileFormat }), // No color for file
];

// Create logger instance
const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
});

/* logger.info('This is an info message');
logger.warn('This is a warning message');
logger.error('This is an error message'); */
module.exports = logger;
