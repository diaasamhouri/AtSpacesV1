import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';

export const winstonConfig: WinstonModuleOptions = {
    transports: [
        new winston.transports.Console({
            format: process.env.NODE_ENV === 'production'
                ? winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.json(),
                )
                : winston.format.combine(
                    winston.format.colorize(),
                    winston.format.timestamp({ format: 'HH:mm:ss' }),
                    winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
                        const ctx = context ? `[${context}]` : '';
                        const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
                        return `${timestamp} ${level} ${ctx} ${message}${extra}`;
                    }),
                ),
        }),
    ],
};
