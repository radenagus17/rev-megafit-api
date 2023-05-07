const multer = require("multer");
const moment = require("moment");

const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: function (req, file, cb) {
    cb(null, moment().format("YYYY-MM-DD") + " - " + file.originalname);
  },
});

const uploadAny = multer({
  storage: storage,
});

const uploadSingle = multer({
  storage: storage,
});

module.exports = { uploadAny, uploadSingle };
