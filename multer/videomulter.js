const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads'); 
  },
  filename: (req, file, cb) => {
    const filename = `video-${Date.now()}${file.originalname}`
    cb(null,filename)
  }
});

// Filter
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'video/mp4') {
    cb(null, true);
  } else {
    cb(null, false);
    return cb(new Error("Only .mp4 format allowed"));
  }
}

const uploadvideo = multer({
  storage: storage,
  fileFilter: fileFilter
});

module.exports = uploadvideo;
