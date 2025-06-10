import db from '../../../../utils/db';

export async function saveDocumentToDb(fileName: string, etag: string, url: string) {
  const query = `
    INSERT INTO templates (name, temp_link, temp_etag, created_at, updated_at)
    VALUES ($1, $2, $3, NOW(), NOW())
    RETURNING *;
  `;

  const values = [fileName, etag, url];

  try {
    const result = await db.query(query, values);
    if (result) {
      return { success: true };
    }
  } catch (err) {
    console.error('DB Save Error:', err);
    throw err;
  }
}
