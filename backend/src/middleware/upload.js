import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Target upload directory for EMR documents and diagnostic test reports
const uploadDir = path.join(__dirname, '../../uploads/emr');

// Ensure upload directory exists synchronously
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer disk storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBaseName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 50);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${safeBaseName}-${uniqueSuffix}${ext}`);
  },
});

// Allowed MIME types and file extensions
const allowedMimeTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/dicom',
];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype) || file.originalname.match(/\.(pdf|jpe?g|png|webp|gif|docx?|txt|dcm)$/i)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Unsupported file format. Allowed formats: PDF, JPG, PNG, WEBP, DOC, DOCX, TXT, DICOM.'
      ),
      false
    );
  }
};

// Multer upload middleware instance (10 MB max)
export const uploadEmrDocument = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter,
});

export default uploadEmrDocument;
