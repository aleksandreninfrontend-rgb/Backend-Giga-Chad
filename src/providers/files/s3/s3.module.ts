import * as AWS from '@aws-sdk/client-s3';
import { Module } from '@nestjs/common';

import { S3Lib } from './constants/do-spaces-service-lib.constant.js';
import { S3Service } from './s3.service.js';

@Module({
  providers: [
    S3Service,
    {
      provide: S3Lib,
      useFactory: async () => {
        return new AWS.S3({
          endpoint: 'http://127.0.0.1:19000',
          region: 'us-east-1',
          forcePathStyle: true,
          credentials: {
            accessKeyId: 'minioadmin',
            secretAccessKey: 'minioadmin',
          },
        });
      },
    },
  ],
  exports: [S3Service, S3Lib],
})
export class S3Module {}
