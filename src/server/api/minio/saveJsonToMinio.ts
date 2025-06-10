import { minioClient } from '../../../../utils/minioClient';
import { Readable } from 'stream';

export async function saveJsonToMinio(bucket: string, fileName: string, jsonData: any) {
    const jsonString = JSON.stringify(jsonData, null, 2);
    const buffer = Buffer.from(jsonString, 'utf-8');
    
    const stream = Readable.from(buffer);
  
    const metaData = {
      'Content-Type': 'application/json',
    };
  
    const res = await minioClient.putObject(bucket, fileName, stream, metaData);
    if (res.etag) {
        const endpoint = 'localhost:4801/browser';
        const url = `${endpoint}/${bucket}/${fileName}`;
        return {
            etag: res.etag,
            url,
        };
    }
    //TODO:Error handling
}