require("dotenv").config();
const multer = require("multer");
const AWS = require("aws-sdk");
const multerS3 = require("multer-s3");
const path = require("path");

const s3 = new AWS.S3({
  region: process.env.AWS_REGION ,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY,
});

const imageVideoFilter = (req, file, cb) => {
  const fileTypes = /jpeg|jpg|png|mp4|mov|avi|webm/;
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = fileTypes.test(file.mimetype);
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only image and video files are allowed!"), false);
  }
};

const pdfFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed!"), false);
  }
};

const s3Storage = (fileFilter) => {
  return multer({
    storage: multerS3({
      s3,
      bucket: process.env.AWS_BUCKET_NAME,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      metadata: (req, file, cb) => {
        cb(null, { fieldName: file.fieldname });
      },
      key: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = `${Date.now()}-${Math.round(
          Math.random() * 1e9
        )}${ext}`;
        cb(null, filename);
      },
    }),
    fileFilter,
    limits: { fileSize: 100 * 1024 * 1024 },
  });
};
const deleteFromS3 = async (fileKey) => {
  try {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey, 
    };

    await s3.deleteObject(params).promise();
    console.log(`S3 delete successful: ${fileKey}`);
  } catch (err) {
    console.error("S3 delete error:", err.message);
    
  }
};

const excelFilter = (req, file, cb) => {
  if (file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
    cb(null, true);
  } else {
    cb(new Error("Only Excel files (.xlsx) are allowed!"), false);
  }
};


module.exports = {
  categoryLogo: s3Storage(imageVideoFilter),
  coursesImg: s3Storage(imageVideoFilter),
  coursePdf: s3Storage(pdfFilter),
  s3,
  deleteFromS3,
  excelUpload: s3Storage(excelFilter),
};

// prod-learnitfy-server-s3-01
