const { tblLog, tblUser } = require("../models");
const { createDateAsUTC } = require("./convertDate");

module.exports = {
  async log(args) {
    try {
      let user = await tblUser.findByPk(args.userId);

      let newData = {
        userId: args.userId,
        name: user.fullname,
        url: args.url,
        method: args.method,
        status: args.status,
        message: args.message,
      };
      await tblLog.create(newData);
    } catch (err) {
      console.log(createDateAsUTC(new Date()), err);
    }
  },
};
