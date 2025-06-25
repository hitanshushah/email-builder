import db from '../../../../utils/db';

export async function saveDocumentToDb(templateName: string, minioFileName: string, link: string, userId: number) {
  const query = `
    INSERT INTO templates (name, link, user_id)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;

  const values = [templateName, link, userId];

  try {
    const result = await db.query(query, values);
    if (result) {
      return { success: true, template: result.rows[0] };
    }
  } catch (err) {
    console.error('DB Save Error:', err);
    throw err;
  }
}
