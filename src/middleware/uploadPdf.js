const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'coursePdf/'); 
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const extname = path.extname(file.originalname).toLowerCase();
  const isPdf = extname === '.pdf' && file.mimetype === 'application/pdf';

  if (isPdf) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const coursePdf = multer({
  storage,
  fileFilter
});

module.exports = coursePdf;
