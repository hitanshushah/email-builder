import { minioClient } from '../../../../utils/minioClient';
import { Readable } from 'stream';

export async function saveJsonToMinio(bucket: string, fileName: string, jsonData: any) {
    const jsonString = JSON.stringify(jsonData, null, 2);
    const buffer = Buffer.from(jsonString, 'utf-8');
    
    const stream = Readable.from(buffer);
  
    const metaData = {
      'Content-Type': 'application/json',
    };
  
    const res = await minioClient.putObject(bucket, fileName, stream, buffer.length, metaData);
    if (res.etag) {
        const endpoint = process.env.MINIO_PUBLIC_URL;
        const url = `${endpoint}/${bucket}/${fileName}`;
        return {
            etag: res.etag,
            url,
        };
    }
    //TODO:Error handling
}

export async function deleteFileFromMinio(bucket: string, fileName: string) {
    try {
        await minioClient.removeObject(bucket, fileName);
        return { success: true };
    } catch (err) {
        console.error('MinIO Delete Error:', err);
        return { success: false, error: err };
    }
}

export async function extractFileNameFromLink(link: string): Promise<string | null> {
    try {
        // Parse bucket and object name from the link
        // Example link: http://localhost:4801/browser/default-bucket/document-1750823153225-akadmin.json
        const match = link.match(/\/([^/]+\.json)$/);
        if (match) {
            return match[1];
        }
        return null;
    } catch (err) {
        console.error('Error extracting filename from link:', err);
        return null;
    }
}

// Fetch JSON data from MinIO for comparison
export async function fetchJsonFromMinio(link: string): Promise<any> {
    try {
        // Parse bucket and object name from the link
        // Example link: http://localhost:4801/browser/default-bucket/document-1750823153225-akadmin.json
        const match = link.match(/\/([^/]+)\/([^/]+\.json)$/);
        if (!match) {
            throw new Error('Invalid link format');
        }
        const bucket = match[1];
        const objectName = match[2];
        
        const dataStream = await minioClient.getObject(bucket, objectName);
        const chunks: Buffer[] = [];
        for await (const chunk of dataStream as Readable) {
            chunks.push(Buffer.from(chunk));
        }
        const jsonStr = Buffer.concat(chunks).toString('utf-8');
        return JSON.parse(jsonStr);
    } catch (err) {
        console.error('MinIO Fetch Error:', err);
        throw err;
    }
}

// Compare two JSON objects for equality
export function compareJsonObjects(obj1: any, obj2: any): boolean {
    try {
        const json1 = JSON.stringify(obj1, null, 2);
        const json2 = JSON.stringify(obj2, null, 2);
        return json1 === json2;
    } catch (err) {
        console.error('JSON Comparison Error:', err);
        return false;
    }
}