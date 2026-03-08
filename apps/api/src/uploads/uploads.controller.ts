import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    Get,
    Param,
    Res,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { basename, extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import type { Response } from 'express';
import { v4 as uuid } from 'uuid';

const UPLOAD_DIR = join(process.cwd(), 'uploads');

// Ensure uploads directory exists
if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true });
}

@ApiTags('Uploads')
@Controller('uploads')
export class UploadsController {
    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Upload a file (images only)' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
            },
        },
    })
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
                filename: (_req, file, cb) => {
                    const uniqueName = `${uuid()}${extname(file.originalname)}`;
                    cb(null, uniqueName);
                },
            }),
            limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
            fileFilter: (_req, file, cb) => {
                if (!file.mimetype.startsWith('image/')) {
                    return cb(
                        new BadRequestException('Only image files are allowed'),
                        false,
                    );
                }
                cb(null, true);
            },
        }),
    )
    uploadFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file provided');
        }
        return {
            url: `/uploads/${file.filename}`,
            filename: file.filename,
            originalName: file.originalname,
            size: file.size,
        };
    }

    @Get(':filename')
    @ApiOperation({ summary: 'Serve an uploaded file' })
    serveFile(@Param('filename') filename: string, @Res() res: Response) {
        const safeName = basename(filename);
        if (safeName !== filename || safeName.includes('..')) {
            throw new BadRequestException('Invalid filename');
        }
        const filePath = join(UPLOAD_DIR, safeName);
        if (!existsSync(filePath)) {
            throw new BadRequestException('File not found');
        }
        return res.sendFile(filePath);
    }
}
