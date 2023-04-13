const { tblClassPt, tblUser, tblHistoryPT, tblMember, tblTransaction, tblOrderList, tblPackageMemberships, tblRevenue, tblStaff, tblHistoryClasses, tblClasses, tblPackageClasses, tblSubCategoryMembership } = require("../models");
const Op = require("sequelize").Op;
const { QueryTypes } = require("sequelize");
const { getWeek } = require("../helpers/getNumberOfWeek");
const { createDateAsUTC } = require("../helpers/convertDate");

class historyClassController {
  static async findAll(req, res, next) {
    let data
    try {
      if(req.query.history_member === "true"){
        data = await tblHistoryClasses.findAll({
          where: {
            userId: req.query.userId ? req.query.userId : req.user.userId,
          },
          include: [
            {
              model: tblClasses,
              include: [{ model: tblUser },{ model: tblSubCategoryMembership }],
            },
          ],
        });

        await data.sort(compareTime);
        await data.sort(compareDate);
        await data.sort(compareWeek);
        await data.sort(compareMonth);
        await data.sort(compareYear);
      }else{
        data = await tblHistoryClasses.sequelize.query(
          "SELECT tblHistoryClasses.userId,tblUsers.fullname AS `PT`,tblSubCategoryMemberships.subCategoryMembership AS `className`,tblClasses.id AS `classId`,tblClasses.timeIn,tblClasses.timeOut,tblClasses.date,tblClasses.month,tblClasses.week,tblClasses.year FROM `tblHistoryClasses` INNER JOIN `tblClasses` ON `tblClasses`.`id` = `tblHistoryClasses`.`classId` INNER JOIN `tblUsers` ON `tblClasses`.`ptId` = `tblUsers`.`userId` INNER JOIN `tblSubCategoryMemberships` ON `tblClasses`.`subCategoryMembershipId` = `tblSubCategoryMemberships`.`id` WHERE `tblClasses`.`date` = $1 AND `tblClasses`.`month` = $2 AND `tblClasses`.`year` = $3",
          {
            bind: [req.query.date, req.query.month, req.query.year],
            raw: true,
            type: QueryTypes.SELECT,
          }
        );
      }
      res.status(200).json({ message: "Success", totalRecord: data.length, data });
    } catch (error) {
      console.log(error)
    }
  }
}

function compareYear(a, b) {
  if (Number(a.tblClass.year) < Number(b.tblClass.year)) {
    return -1;
  }
  if (Number(a.tblClass.year) > Number(b.tblClass.year)) {
    return 1;
  }
  return 0;
}

function compareMonth(a, b) {
  if (Number(a.tblClass.month) < Number(b.tblClass.month)) {
    return -1;
  }
  if (Number(a.tblClass.month) > Number(b.tblClass.month)) {
    return 1;
  }
  return 0;
}

function compareWeek(a, b) {
  if (Number(a.tblClass.week) < Number(b.tblClass.week)) {
    return -1;
  }
  if (Number(a.tblClass.week) > Number(b.tblClass.week)) {
    return 1;
  }
  return 0;
}

function compareDate(a, b) {
  if (Number(a.tblClass.date) < Number(b.tblClass.date)) {
    return -1;
  }
  if (Number(a.tblClass.date) > Number(b.tblClass.date)) {
    return 1;
  }
  return 0;
}

function compareTime(a, b) {
  if (a.tblClass.timeIn < b.tblClass.timeIn) {
    return -1;
  }
  if (a.tblClass.timeIn > b.tblClass.timeIn) {
    return 1;
  }
  return 0;
}

module.exports = historyClassController