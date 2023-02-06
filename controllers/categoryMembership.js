const { log } = require("../helpers/log");
const { tblCategoryMembership, tblSubCategoryMembership } = require("../models");

class categoryMembership {
  static async findAll(req, res, next) {
    try {
      let data = await tblCategoryMembership.findAll({
        include: [
          {
            model: tblSubCategoryMembership,
          },
        ],
      });

      if (data) res.status(200).json({ message: "Success", totalRecord: data.length, data });

      let newData = {
        userId: req.user.userId,
        url: `http://megafit.co.id/category-memberships`,
        method: "get",
        status: 200,
        message: "",
      };

      log(newData);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = categoryMembership;
