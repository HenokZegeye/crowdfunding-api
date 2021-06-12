const path = require("path");
const multer = require("multer");

const uploadLocation = "././uploads_image";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadLocation);
  },
  filename: function (req, file, cb) {
    const fileName = file.originalname.toLowerCase().split(" ").join("-");
    cb(null, Date.now() + "-" + fileName);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, callback) {
    if (
      file.mimetype == "image/png" ||
      file.mimetype == "image/jpg" ||
      file.mimetype == "image/jpeg"
    ) {
      callback(null, true);
      return callback(console.log("picture added successfully"));
    } else {
      callback(null, false);
      return callback(new Error("Only .png, .jpg and .jpeg format allowed!"));
    }
  },
});

module.exports = upload;


