const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'securepaste',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

// Ensure DB schema is up to date (idempotent)
async function ensureSchema() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE IF EXISTS pastes
        ADD COLUMN IF NOT EXISTS password_salt TEXT,
        ADD COLUMN IF NOT EXISTS password_iterations INTEGER;
    `);
  } finally {
    client.release();
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// File storage setup
const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, 'uploads');

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    cb(null, uuidv4() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Ensure uploads directory exists
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

// Routes

// Get paste by ID
app.get('/api/pastes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM pastes WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Paste not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching paste:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new paste
app.post('/api/pastes', async (req, res) => {
  try {
    const {
      content,
      language = 'text',
      expiration = '1h',
      burn_after_reading = false,
      password_hash = null,
      password_salt = null,
      password_iterations = null,
      is_file = false,
      file_name = null,
      file_type = null,
      file_size = null
    } = req.body;

    const id = uuidv4();
    let expires_at = null;

    // Calculate expiration
    const now = new Date();
    switch (expiration) {
      case '10m':
        expires_at = new Date(now.getTime() + 10 * 60 * 1000);
        break;
      case '1h':
        expires_at = new Date(now.getTime() + 60 * 60 * 1000);
        break;
      case '24h':
        expires_at = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'burn':
        expires_at = null;
        break;
      default:
        expires_at = new Date(now.getTime() + 60 * 60 * 1000);
    }

    const result = await pool.query(`
      INSERT INTO pastes (
        id, content, language, expiration, burn_after_reading, 
        password_hash, password_salt, password_iterations, is_file, file_name, file_type, file_size, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      id, content, language, expiration, burn_after_reading,
      password_hash, password_salt, password_iterations, is_file, file_name, file_type, file_size, expires_at
    ]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating paste:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update paste
app.put('/api/pastes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const values = [id, ...Object.values(updates)];
    
    const result = await pool.query(`
      UPDATE pastes SET ${setClause}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Paste not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating paste:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete paste
app.delete('/api/pastes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get paste info for file cleanup
    const pasteResult = await pool.query('SELECT * FROM pastes WHERE id = $1', [id]);
    
    if (pasteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Paste not found' });
    }
    
    const paste = pasteResult.rows[0];
    
    // Delete from database
    await pool.query('DELETE FROM pastes WHERE id = $1', [id]);
    
    // Delete file if exists
    if (paste.is_file && paste.file_name) {
      const filePath = path.join(uploadsDir, 'encrypted-files', paste.file_name);
      try {
        await fs.unlink(filePath);
      } catch (fileError) {
        console.error('Error deleting file:', fileError);
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting paste:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// File upload
app.post('/api/storage/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { bucket, path: filePath } = req.body;
    const newPath = path.join(uploadsDir, bucket, filePath);
    
    // Ensure bucket directory exists
    await fs.mkdir(path.dirname(newPath), { recursive: true });
    
    // Move file to bucket directory
    await fs.rename(req.file.path, newPath);

    res.json({ success: true, path: newPath });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// File download
app.get('/api/storage/:bucket/:filename', async (req, res) => {
  try {
    const { bucket, filename } = req.params;
    const filePath = path.join(uploadsDir, bucket, filename);
    const fileBuffer = await fs.readFile(filePath);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(fileBuffer);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(404).json({ error: 'File not found' });
  }
});

// File deletion
app.delete('/api/storage/:bucket/:filename', async (req, res) => {
  try {
    const { bucket, filename } = req.params;
    const filePath = path.join(uploadsDir, bucket, filename);
    
    await fs.unlink(filePath);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const cleanupExpiredPastes = async () => {
  const now = new Date();
  
  // Get expired pastes
  const expiredResult = await pool.query(`
    SELECT * FROM pastes 
    WHERE expires_at IS NOT NULL AND expires_at < $1
  `, [now]);
  
  // Get burned pastes
  const burnedResult = await pool.query(`
    SELECT * FROM pastes 
    WHERE burn_after_reading = true AND viewed = true
  `);
  
  const allToDelete = [...expiredResult.rows, ...burnedResult.rows];
  
  // Delete files and database records
  for (const paste of allToDelete) {
    if (paste.is_file && paste.file_name) {
      const filePath = path.join(uploadsDir, 'encrypted-files', paste.file_name);
      try {
        await fs.unlink(filePath);
      } catch (fileError) {
        console.error('Error deleting file:', fileError);
      }
    }
    
    await pool.query('DELETE FROM pastes WHERE id = $1', [paste.id]);
  }

  return {
    deleted: allToDelete.length,
    expired: expiredResult.rows.length,
    burned: burnedResult.rows.length
  };
};

// Cleanup expired pastes (manual trigger)
app.post('/api/cleanup', async (req, res) => {
  try {
    const result = await cleanupExpiredPastes();
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error during cleanup:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Background cleanup job
const CLEANUP_INTERVAL_MS = parseInt(process.env.CLEANUP_INTERVAL_MS || `${15 * 60 * 1000}`, 10);
let cleanupInProgress = false;

setInterval(async () => {
  if (cleanupInProgress) return;
  cleanupInProgress = true;
  try {
    const result = await cleanupExpiredPastes();
    if (result.deleted > 0) {
      console.log(`Cleanup removed ${result.deleted} pastes (expired: ${result.expired}, burned: ${result.burned})`);
    }
  } catch (error) {
    console.error('Scheduled cleanup failed:', error);
  } finally {
    cleanupInProgress = false;
  }
}, CLEANUP_INTERVAL_MS);

ensureSchema()
  .catch((err) => {
    console.error('Schema check failed:', err);
    process.exit(1);
  })
  .then(() => {
    app.listen(port, () => {
      console.log(`SecurePaste PostgreSQL API running on port ${port}`);
    });
  });
