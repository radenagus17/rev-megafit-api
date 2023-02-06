const { tblUser } = require("../models");
const { verify } = require("../helpers/jsonwebtoken");
const { createDateAsUTC } = require("../helpers/convertDate");

const authentication = async (req, res, next) => {
  try {
    let decoded = verify(req.headers.token);
    const userFound = await tblUser.findByPk(decoded.userId);
    if (!userFound) throw { name: "unauthorized" };
    req.user = userFound;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authentication,
};
