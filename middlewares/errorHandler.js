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
    case "emailFound":
      status = 409;
      errMessage = "Email is already used by other users";
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
  res.status(status).json({
    success: false,
    error: errMessage,
  });
}

module.exports = errorHandler;
