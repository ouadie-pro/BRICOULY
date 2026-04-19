const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = /image\/(jpeg|jpg|png|gif|webp)/.test(file.mimetype);
  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Only image files are allowed'));
};

const videoFilter = (req, file, cb) => {
  const allowedTypes = /mp4|webm|mov|avi/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = /video\//.test(file.mimetype);
  if (extname || mimetype) {
    return cb(null, true);
  }
  cb(new Error('Only video files are allowed'));
};

const mediaFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  const allowedVideoTypes = /mp4|webm|mov|avi|mkv/;
  const allowedAudioTypes = /mp3|wav|ogg|aac|m4a|webm/;
  const extname = path.extname(file.originalname).toLowerCase().slice(1);
  const mimetype = file.mimetype;
  
  const isImage = /image\/(jpeg|jpg|png|gif|webp)/.test(mimetype) && allowedImageTypes.test(extname);
  const isVideo = /video\//.test(mimetype) || allowedVideoTypes.test(extname);
  const isAudio = /audio\//.test(mimetype) || allowedAudioTypes.test(extname);
  
  if (isImage || isVideo || isAudio) {
    return cb(null, true);
  }
  cb(new Error('Only image, video, or audio files are allowed'));
};

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: imageFilter,
});

const uploadVideo = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: videoFilter,
});

const uploadMedia = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: mediaFilter,
});

const uploadMultiple = upload.array('images', 10);

module.exports = { upload, uploadVideo, uploadMedia, uploadMultiple };