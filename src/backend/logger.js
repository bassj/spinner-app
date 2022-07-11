import winston from 'winston';

const debug = process.env.NODE_ENV === 'production';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: debug ? [
        new winston.transports.Console({ format: winston.format.simple() }),
    ] : [
        new winston.transports.File({ filename: 'out.log', format: winston.format.simple() })
    ]
});

export default logger;
