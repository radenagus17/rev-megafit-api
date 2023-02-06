// const { sendErrorReport } = require("../helpers/nodemailer");

function errorHandler(err, req, res, next) {
  let status = null;
  let errMessage = null;

  switch (err.name) {
    case "unauthorized":
      status = 401;
      errMessage = "Not Authorized";
      break;
    case "badRequest":
      status = 400;
      errMessage = "Username/Password is required";
      break;
    case "badPassword":
      status = 400;
      errMessage = "Invalid Username/Password";
      break;
    case "userNotFound":
      status = 400;
      errMessage = "Failed user not found";
      break;
    case "notFound":
      status = 400;
      errMessage = "Data Not Found";
      break;
    case "scheduleOn":
      status = 403;
      errMessage = "Schedule has on";
      break;
    case "slotFull":
      status = 403;
      errMessage = "Slot Full";
      break;
    case "nullPG":
      status = 403;
      errMessage = "Tidak Memiliki Sesi Private Gym";
      break;
    case "sessionDone":
      status = 403;
      errMessage = "PT Session telah habis";
      break;
    case "emailFound":
      status = 409;
      errMessage = "Email is already used by other users";
      break;
    case "fullBook":
      status = 409;
      errMessage = "Locker key sudah terpakai";
      break;
    case "phoneFound":
      status = 409;
      errMessage = "Phone is already used by other users";
      break;
    default:
      status = 500;
      errMessage = "Internal Server Error";
      break;
  }
  console.log(err);
  // sendErrorReport(req, req.body.fullname || null, JSON.stringify(req.body), err);
  res.status(status).json({
    success: false,
    error: errMessage,
  });
}

module.exports = errorHandler;
