import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger('ExceptionFilter');

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message: string | string[] = 'Internal server error';

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const res = exception.getResponse();
            message = typeof res === 'string' ? res : (res as any).message || message;
        } else {
            this.logger.error(
                'Unhandled exception',
                exception instanceof Error ? exception.stack : String(exception),
            );
        }

        response.status(status).json({
            statusCode: status,
            message,
            ...(process.env.NODE_ENV !== 'production' && exception instanceof Error
                ? { stack: exception.stack }
                : {}),
        });
    }
}
