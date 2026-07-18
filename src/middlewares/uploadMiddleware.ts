import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

// ─── CONFIG ─────────────────────────────────────────────────────────
export const IMAGE_UPLOAD_FIELD_NAME = 'image';
export const MAX_IMAGE_SIZE_MB = 10;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg', // non-standard but sometimes sent by clients for .jpg files
  'image/png',
  'image/webp',
]);

// ─── MULTER INSTANCE (memory storage — no disk writes, no schema/db touch) ──
const storage = multer.memoryStorage();

function fileFilter(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(new Error('UNSUPPORTED_FILE_TYPE'));
    return;
  }
  cb(null, true);
}

const imageUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_IMAGE_SIZE_BYTES,
    files: 1,
  },
});

// ─── WRAPPER MIDDLEWARE ─────────────────────────────────────────────
// Wraps multer's single-file upload so we can return consistent JSON
// error responses (matching the rest of the API) instead of letting
// multer's error bubble up to a default Express error handler.
export function handleImageUpload(req: Request, res: Response, next: NextFunction): void {
  const singleUpload = imageUpload.single(IMAGE_UPLOAD_FIELD_NAME);

  singleUpload(req, res, (err: unknown) => {
    if (!err) {
      next();
      return;
    }

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
          success: false,
          message: `Image is too large. Maximum allowed size is ${MAX_IMAGE_SIZE_MB}MB.`,
        });
        return;
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        res.status(400).json({
          success: false,
          message: `Unexpected field. Please upload the image using the "${IMAGE_UPLOAD_FIELD_NAME}" field.`,
        });
        return;
      }
      res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
      return;
    }

    if (err instanceof Error && err.message === 'UNSUPPORTED_FILE_TYPE') {
      res.status(400).json({
        success: false,
        message: 'Unsupported image type. Only JPG, JPEG, PNG, and WEBP are allowed.',
      });
      return;
    }

    res.status(400).json({ success: false, message: 'Failed to process the uploaded image.' });
  });
}