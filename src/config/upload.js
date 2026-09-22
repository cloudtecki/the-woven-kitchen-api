'use strict';

const path = require('node:path');
const fs = require('node:fs');
const multer = require('multer');
const { ValidationError } = require('../shared/errors');

const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'menu');

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    cb(null, `${req.params.id}-${Date.now()}${ext}`);
  },
});

function fileFilter(_req, file, cb) {
  const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
    return;
  }
  cb(new ValidationError('Only JPG, PNG or WEBP images are allowed'));
}

const uploadMenuImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = { uploadMenuImage, uploadDir };
