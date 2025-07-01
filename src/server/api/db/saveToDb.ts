import db from '../../../../utils/db';
import { v4 as uuidv4 } from 'uuid';

// Utility function to generate template key name from name
export function generateTemplateKeyName(templateName: string): string {
  return templateName.toLowerCase().replace(/\s+/g, '');
}

// Check if template key name exists for a user
export async function checkTemplateKeyNameExists(keyName: string, userId: number) {
  const query = `
    SELECT id, key, key_name, display_name FROM templates 
    WHERE key_name = $1 AND user_id = $2
  `;

  const values = [keyName, userId];

  try {
    const result = await db.query(query, values);
    if (result.rows.length > 0) {
      return { exists: true, template: result.rows[0] };
    }
    return { exists: false, template: null };
  } catch (err) {
    console.error('DB Check Error:', err);
    throw err;
  }
}

// Save new template to templates table
export async function saveNewTemplateToDb(keyName: string, displayName: string, userId: number) {
  const key = uuidv4(); // Generate UUID for key
  
  const query = `
    INSERT INTO templates (key, key_name, display_name, user_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;

  const values = [key, keyName, displayName, userId];

  try {
    const result = await db.query(query, values);
    if (result && result.rows.length > 0) {
      return { success: true, template: result.rows[0] };
    }
  } catch (err) {
    console.error('DB Save Template Error:', err);
    throw err;
  }
}

// Get the next version number for a template
export async function getNextVersionNumber(templateId: number) {
  const query = `
    SELECT COALESCE(MAX(version_no), 0) + 1 as next_version
    FROM versions 
    WHERE template_id = $1
  `;

  const values = [templateId];

  try {
    const result = await db.query(query, values);
    return result.rows[0].next_version;
  } catch (err) {
    console.error('DB Get Version Error:', err);
    throw err;
  }
}

// Save version to versions table
export async function saveVersionToDb(templateId: number, fileName: string, link: string, versionNo: number) {
  const query = `
    INSERT INTO versions (template_id, file_name, link, version_no)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;

  const values = [templateId, fileName, link, versionNo];

  try {
    const result = await db.query(query, values);
    if (result && result.rows.length > 0) {
      return { success: true, version: result.rows[0] };
    }
  } catch (err) {
    console.error('DB Save Version Error:', err);
    throw err;
  }
}

// Get template by key
export async function getTemplateByKey(templateKey: string, userId: number) {
  const query = `
    SELECT id, key, key_name, display_name FROM templates 
    WHERE key = $1 AND user_id = $2
  `;

  const values = [templateKey, userId];

  try {
    const result = await db.query(query, values);
    if (result.rows.length > 0) {
      return { success: true, template: result.rows[0] };
    }
    return { success: false, template: null };
  } catch (err) {
    console.error('DB Get Template Error:', err);
    throw err;
  }
}

// Get all templates with all their versions for a user
export async function getAllTemplatesWithVersions(userId: number) {
  const query = `
    SELECT 
      t.id,
      t.key,
      t.key_name,
      t.display_name,
      t.created_at,
      v.id as version_id,
      v.file_name,
      v.link,
      v.version_no,
      v.created_at as version_created_at
    FROM templates t
    LEFT JOIN versions v ON t.id = v.template_id
    WHERE t.user_id = $1
    ORDER BY t.created_at DESC, v.version_no DESC
  `;

  const values = [userId];

  try {
    const result = await db.query(query, values);
    return { success: true, templates: result.rows };
  } catch (err) {
    console.error('DB Get Templates Error:', err);
    throw err;
  }
}

// Get version by ID
export async function getVersionById(versionId: number) {
  const query = `
    SELECT v.*, t.key, t.display_name
    FROM versions v
    JOIN templates t ON v.template_id = t.id
    WHERE v.id = $1
  `;

  const values = [versionId];

  try {
    const result = await db.query(query, values);
    if (result.rows.length > 0) {
      return { success: true, version: result.rows[0] };
    }
    return { success: false, version: null };
  } catch (err) {
    console.error('DB Get Version Error:', err);
    throw err;
  }
}

// Update version link
export async function updateVersionLink(versionId: number, newLink: string) {
  const query = `
    UPDATE versions 
    SET link = $1 
    WHERE id = $2
    RETURNING *;
  `;

  const values = [newLink, versionId];

  try {
    const result = await db.query(query, values);
    if (result && result.rows.length > 0) {
      return { success: true, version: result.rows[0] };
    }
    return { success: false, version: null };
  } catch (err) {
    console.error('DB Update Version Link Error:', err);
    throw err;
  }
}

// Check if category key exists
export async function checkCategoryKeyExists(keyName: string) {
  const query = `
    SELECT id, key, display_name FROM categories 
    WHERE key = $1
  `;

  const values = [keyName];

  try {
    const result = await db.query(query, values);
    if (result.rows.length > 0) {
      return { exists: true, category: result.rows[0] };
    }
    return { exists: false, category: null };
  } catch (err) {
    console.error('DB Check Category Error:', err);
    throw err;
  }
}

// Save new category to categories table
export async function saveNewCategoryToDb(keyName: string, displayName: string) {
  const query = `
    INSERT INTO categories (key, display_name)
    VALUES ($1, $2)
    RETURNING *;
  `;

  const values = [keyName, displayName];

  try {
    const result = await db.query(query, values);
    if (result && result.rows.length > 0) {
      return { success: true, category: result.rows[0] };
    }
  } catch (err) {
    console.error('DB Save Category Error:', err);
    throw err;
  }
}

// Get all categories
export async function getAllCategories() {
  const query = `
    SELECT id, key, display_name, created_at
    FROM categories
    ORDER BY display_name ASC
  `;

  try {
    const result = await db.query(query);
    return { success: true, categories: result.rows };
  } catch (err) {
    console.error('DB Get Categories Error:', err);
    throw err;
  }
}
