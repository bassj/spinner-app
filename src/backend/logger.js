import config from 'config';
import winston from 'winston';

const logger = winston.createLogger({
    level: config.APP_LOG_LEVEL,
    format: winston.format.json(),
    transports: config.DEBUG ? [
        new winston.transports.Console({ format: winston.format.simple() }),
    ] : [
        new winston.transports.Console({ format: winston.format.simple() }),
        new winston.transports.File({ filename: 'out.log', format: winston.format.simple() })
    ]
});

export default logger;
