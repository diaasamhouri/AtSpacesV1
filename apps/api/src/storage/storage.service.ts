import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuid } from 'uuid';
import { extname } from 'path';

@Injectable()
export class StorageService implements OnModuleInit {
    private readonly logger = new Logger(StorageService.name);
    private s3: S3Client;
    private bucket: string;
    private publicUrl: string;

    constructor(private config: ConfigService) {}

    onModuleInit() {
        const accountId = this.config.get<string>('R2_ACCOUNT_ID');
        this.bucket = this.config.get<string>('R2_BUCKET_NAME') || 'atspaces-uploads';
        this.publicUrl = this.config.get<string>('R2_PUBLIC_URL') || '';

        if (!accountId) {
            this.logger.warn('R2_ACCOUNT_ID not set — uploads will fail in production');
            return;
        }

        this.s3 = new S3Client({
            region: 'auto',
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: this.config.get<string>('R2_ACCESS_KEY_ID') || '',
                secretAccessKey: this.config.get<string>('R2_SECRET_ACCESS_KEY') || '',
            },
        });
        this.logger.log('R2 storage client initialized');
    }

    async upload(file: Express.Multer.File): Promise<{ key: string; url: string }> {
        const key = `${uuid()}${extname(file.originalname)}`;
        await this.s3.send(new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
        }));
        return {
            key,
            url: this.publicUrl ? `${this.publicUrl}/${key}` : key,
        };
    }

    async delete(key: string): Promise<void> {
        await this.s3.send(new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: key,
        }));
    }

    isConfigured(): boolean {
        return !!this.s3;
    }
}
