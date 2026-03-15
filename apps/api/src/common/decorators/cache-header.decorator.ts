import { UseInterceptors, CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import type { Response } from 'express';

@Injectable()
class CacheHeaderInterceptor implements NestInterceptor {
    constructor(private maxAge: number) {}
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            tap(() => {
                const res = context.switchToHttp().getResponse<Response>();
                res.setHeader('Cache-Control', `public, max-age=${this.maxAge}, s-maxage=${this.maxAge}`);
            }),
        );
    }
}

export function CachePublic(maxAgeSeconds = 60) {
    return UseInterceptors(new CacheHeaderInterceptor(maxAgeSeconds));
}
