/**
 * Logger Utility with Timestamps
 * Provides consistent logging format across the entire server
 */

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',

    // Foreground colors
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
};

/**
 * Get formatted timestamp
 */
const getTimestamp = () => {
    const now = new Date();
    return now.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
};

/**
 * Format log message with timestamp and color
 */
const formatLog = (level, emoji, color, message, ...args) => {
    const timestamp = getTimestamp();
    const prefix = `${colors.gray}[${timestamp}]${colors.reset} ${emoji} ${color}[${level}]${colors.reset}`;

    if (args.length > 0) {
        console.log(prefix, message, ...args);
    } else {
        console.log(prefix, message);
    }
};

/**
 * Logger object with different log levels
 */
const logger = {
    // Info logs - general information
    info: (message, ...args) => {
        formatLog('INFO', 'ℹ️', colors.blue, message, ...args);
    },

    // Success logs - operations completed successfully
    success: (message, ...args) => {
        formatLog('SUCCESS', '✅', colors.green, message, ...args);
    },

    // Warning logs - potential issues
    warn: (message, ...args) => {
        formatLog('WARN', '⚠️', colors.yellow, message, ...args);
    },

    // Error logs - errors that occurred
    error: (message, ...args) => {
        formatLog('ERROR', '❌', colors.red, message, ...args);
    },

    // Debug logs - detailed debugging information
    debug: (message, ...args) => {
        if (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true') {
            formatLog('DEBUG', '🔍', colors.magenta, message, ...args);
        }
    },

    // API logs - HTTP requests
    api: (method, path, status, ...args) => {
        const statusColor = status >= 200 && status < 300 ? colors.green :
            status >= 400 && status < 500 ? colors.yellow :
                colors.red;
        const timestamp = getTimestamp();
        console.log(
            `${colors.gray}[${timestamp}]${colors.reset} 🌐 ${colors.cyan}[API]${colors.reset} ${method} ${path} ${statusColor}${status}${colors.reset}`,
            ...args
        );
    },

    // Database logs - database operations
    db: (message, ...args) => {
        formatLog('DB', '🗄️', colors.cyan, message, ...args);
    },

    // Socket logs - WebSocket events
    socket: (message, ...args) => {
        formatLog('SOCKET', '🔌', colors.magenta, message, ...args);
    },

    // Auth logs - authentication/authorization
    auth: (message, ...args) => {
        formatLog('AUTH', '🔐', colors.yellow, message, ...args);
    },

    // Payment logs - payment operations
    payment: (message, ...args) => {
        formatLog('PAYMENT', '💰', colors.green, message, ...args);
    },

    // Notification logs - notification system
    notification: (message, ...args) => {
        formatLog('NOTIF', '🔔', colors.blue, message, ...args);
    },

    // Booking logs - booking operations
    booking: (message, ...args) => {
        formatLog('BOOKING', '📅', colors.cyan, message, ...args);
    },

    // Message logs - messaging system
    message: (message, ...args) => {
        formatLog('MESSAGE', '💬', colors.magenta, message, ...args);
    },

    // Calendar logs - calendar operations
    calendar: (message, ...args) => {
        formatLog('CALENDAR', '📆', colors.blue, message, ...args);
    },

    // Scheduler/Cron logs - scheduled tasks
    cron: (message, ...args) => {
        formatLog('CRON', '⏰', colors.yellow, message, ...args);
    },

    // File upload logs
    upload: (message, ...args) => {
        formatLog('UPLOAD', '📤', colors.cyan, message, ...args);
    },

    // Custom log with custom emoji and color
    custom: (emoji, level, color, message, ...args) => {
        formatLog(level, emoji, color, message, ...args);
    },

    // Separator line for visual clarity
    separator: () => {
        console.log(colors.gray + '─'.repeat(80) + colors.reset);
    },

    // Group start
    group: (title) => {
        const timestamp = getTimestamp();
        console.log(`\n${colors.gray}[${timestamp}]${colors.reset} ${colors.bright}╔═══ ${title} ═══╗${colors.reset}`);
    },

    // Group end
    groupEnd: () => {
        console.log(`${colors.bright}╚${'═'.repeat(50)}╝${colors.reset}\n`);
    }
};

// Override console methods to add timestamps (optional)
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

logger.overrideConsole = () => {
    console.log = (...args) => {
        const timestamp = getTimestamp();
        originalConsoleLog(`${colors.gray}[${timestamp}]${colors.reset}`, ...args);
    };

    console.error = (...args) => {
        const timestamp = getTimestamp();
        originalConsoleError(`${colors.gray}[${timestamp}]${colors.reset} ${colors.red}`, ...args, colors.reset);
    };

    console.warn = (...args) => {
        const timestamp = getTimestamp();
        originalConsoleWarn(`${colors.gray}[${timestamp}]${colors.reset} ${colors.yellow}`, ...args, colors.reset);
    };
};

// Restore original console methods
logger.restoreConsole = () => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
};

module.exports = logger;

