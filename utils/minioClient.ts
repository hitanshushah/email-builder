import { Client } from 'minio';

export const minioClient = new Client({
  endPoint: 'minio',
  port: 9000,       
  useSSL: false,  
  accessKey: 'dev',
  secretKey: 'password',
});
