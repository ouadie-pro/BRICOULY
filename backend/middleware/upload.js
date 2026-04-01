const multer = require('multer');
const path = require('path');
const fs = require('fs');

if (!fs.existsSync(path.join(__dirname, '../uploads'))) {
  fs.mkdirSync(path.join(__dirname, '../uploads'));
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  // Allow all file types for now
  // The frontend already has type restrictions in the file input accept attribute
  return cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter,
});

module.exports = upload;