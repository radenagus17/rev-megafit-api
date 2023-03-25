const { tblClassPt, tblUser, tblHistoryPT, tblMember, tblTransaction, tblOrderList, tblPackageMemberships, tblRevenue, tblStaff, tblHistoryClasses, tblClasses, tblPackageClasses } = require("../models");
const Op = require("sequelize").Op;
const { QueryTypes } = require("sequelize");
const { getWeek } = require("../helpers/getNumberOfWeek");
const { createDateAsUTC } = require("../helpers/convertDate");

class historyClassController {
  static async findAll(req, res, next) {
    try {
      const data = await tblHistoryClasses.sequelize.query(
        "SELECT tblHistoryClasses.userId,tblUsers.fullname AS `PT`,tblSubCategoryMemberships.subCategoryMembership AS `className`,tblClasses.id AS `classId`,tblClasses.timeIn,tblClasses.timeOut,tblClasses.date,tblClasses.month,tblClasses.week,tblClasses.year FROM `tblHistoryClasses` INNER JOIN `tblClasses` ON `tblClasses`.`id` = `tblHistoryClasses`.`classId` INNER JOIN `tblUsers` ON `tblClasses`.`ptId` = `tblUsers`.`userId` INNER JOIN `tblSubCategoryMemberships` ON `tblClasses`.`subCategoryMembershipId` = `tblSubCategoryMemberships`.`id` WHERE `tblClasses`.`date` = $1 AND `tblClasses`.`month` = $2 AND `tblClasses`.`year` = $3",
        {
          bind: [req.query.date, req.query.month, req.query.year],
          raw: true,
          type: QueryTypes.SELECT,
        }
      );
      res.status(200).json({ message: "Success", totalRecord: data.length, data });
    } catch (error) {
      console.log(error)
    }
  }
}

module.exports = historyClassController