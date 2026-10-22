import * as AWS from '@aws-sdk/client-s3';
import { Module } from '@nestjs/common';

import { S3Lib } from './constants/do-spaces-service-lib.constant.js';
import { S3Service } from './s3.service.js';
import { ConfigService } from '@nestjs/config';

@Module({
  providers: [
    S3Service,
    {
      provide: S3Lib,
      useFactory: (config: ConfigService) => {
        return new AWS.S3({
          endpoint: config.getOrThrow<string>('S3_ENDPOINT'),
          region: config.getOrThrow<string>('S3_REGION'),
          forcePathStyle: config.get('S3_FORCE_PATH_STYLE') !== 'false',
          credentials: {
            accessKeyId: config.getOrThrow<string>('S3_ACCESS_KEY_ID'),
            secretAccessKey: config.getOrThrow<string>('S3_SECRET_ACCESS_KEY'),
          },
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [S3Service, S3Lib],
})
export class S3Module {}
