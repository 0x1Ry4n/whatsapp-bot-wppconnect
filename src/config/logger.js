const winston = require("winston");
const colorizer = winston.format.colorize();

const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.simple(),
        winston.format.printf(msg => {
            if (typeof msg.message === 'object') {
                msg.message = JSON.stringify(msg.message, null, 2);
            }
            return colorizer.colorize(msg.level, `${msg.timestamp} - ${msg.level}: ${msg.message}`)
        })
    ),
    transports: [new winston.transports.Console()],
})

module.exports = logger;