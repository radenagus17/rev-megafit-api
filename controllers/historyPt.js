const { tblClassPt, tblUser, tblHistoryPT, tblMember, tblRevenue } = require("../models");

const Op = require("sequelize").Op;
const { getWeek } = require("../helpers/getNumberOfWeek");
const { QueryTypes } = require("sequelize");
const moment = require("moment");

class historyPT {
  static async findAll(req, res, next) {
    let data;
    try {
      if (req.query.hasPassed === "true") {
        let hour = Number(req.query.hour);

        if (hour < 10) hour = `0${hour}:00:00`;
        else hour = `${hour}:00:00`;

        data = await tblHistoryPT.findAll({
          where: {
            userId: req.query.userId ? req.query.userId : req.user.userId,
          },
          include: [
            {
              model: tblClassPt,
              where: {
                [Op.or]: [
                  {
                    [Op.and]: [
                      { time: { [Op.lte]: hour } },
                      { date: { [Op.lte]: new Date(req.query.date).getDate() } },
                      {
                        month: {
                          [Op.lte]: new Date(req.query.date).getMonth() + 1,
                        },
                      },
                      { week: getWeek(req.query.date) },
                      {
                        year: {
                          [Op.lte]: new Date(req.query.date).getFullYear(),
                        },
                      },
                    ],
                  },
                  {
                    [Op.and]: [
                      { date: { [Op.lt]: new Date(req.query.date).getDate() } },
                      {
                        month: {
                          [Op.lte]: new Date(req.query.date).getMonth() + 1,
                        },
                      },
                      { week: { [Op.lte]: getWeek(req.query.date) } },
                      {
                        year: {
                          [Op.lte]: new Date(req.query.date).getFullYear(),
                        },
                      },
                    ],
                  },
                  {
                    [Op.and]: [
                      {
                        month: {
                          [Op.lt]: new Date(req.query.date).getMonth() + 1,
                        },
                      },
                      { week: { [Op.lt]: getWeek(req.query.date) } },
                      {
                        year: {
                          [Op.lte]: new Date(req.query.date).getFullYear(),
                        },
                      },
                    ],
                  },
                  { year: { [Op.lt]: new Date(req.query.date).getFullYear() } },
                ],
              },
              include: [{ model: tblUser }],
            },
          ],
        });

        await data.sort(compareTime);
        await data.sort(compareDate);
        await data.sort(compareWeek);
        await data.sort(compareMonth);
        await data.sort(compareYear);
      } else if (req.query.checkin === "true") {
        data = await tblHistoryPT.sequelize.query(
          "SELECT tblHistoryPTs.userId, tblUsers.fullname AS `PT`, tblClassPts.time,tblClassPts.date,tblClassPts.month,tblClassPts.week,tblClassPts.year,tblClassPts.isOnline FROM `tblHistoryPTs` INNER JOIN `tblClassPts` ON `tblClassPts`.`classPtId` = `tblHistoryPTs`.`classPtId` INNER JOIN `tblUsers` ON `tblClassPts`.`ptId` = `tblUsers`.`userId` WHERE `tblClassPts`.`date` = $1 AND `tblClassPts`.`month` = $2 AND `tblClassPts`.`year` = $3",
          {
            bind: [req.query.date, req.query.month, req.query.year],
            raw: true,
            type: QueryTypes.SELECT,
          }
        );
      } else if (req.query.date) {
        // History PT for member start/cancel
        let hour = Number(req.query.hour);
        if (hour < 10) hour = `0${hour}:00:00`;
        else hour = `${hour}:00:00`;

        data = await tblHistoryPT.findAll({
          where: { userId: req.user.userId },
          include: [
            {
              model: tblClassPt,
              where: {
                [Op.or]: [
                  {
                    [Op.and]: [
                      { time: { [Op.gte]: hour } },
                      { date: { [Op.gte]: new Date(req.query.date).getDate() } },
                      {
                        month: {
                          [Op.gte]: new Date(req.query.date).getMonth() + 1,
                        },
                      },
                      { week: getWeek(req.query.date) },
                      {
                        year: {
                          [Op.gte]: new Date(req.query.date).getFullYear(),
                        },
                      },
                    ],
                  },
                  {
                    [Op.and]: [
                      { date: { [Op.gt]: new Date(req.query.date).getDate() } },
                      {
                        month: {
                          [Op.gte]: new Date(req.query.date).getMonth() + 1,
                        },
                      },
                      { week: { [Op.gte]: getWeek(req.query.date) } },
                      {
                        year: {
                          [Op.gte]: new Date(req.query.date).getFullYear(),
                        },
                      },
                    ],
                  },
                  {
                    [Op.and]: [
                      { week: { [Op.gt]: getWeek(req.query.date) } },
                      {
                        month: {
                          [Op.gte]: new Date(req.query.date).getMonth() + 1,
                        },
                      },
                      {
                        year: {
                          [Op.gte]: new Date(req.query.date).getFullYear(),
                        },
                      },
                    ],
                  },
                  { year: { [Op.gt]: new Date(req.query.date).getFullYear() } },
                ],
              },
              include: [{ model: tblUser }],
            },
          ],
        });
        await data.sort(compareTime);
        await data.sort(compareDate);
        await data.sort(compareWeek);
        await data.sort(compareMonth);
        await data.sort(compareYear);
      } else if (req.query.laporan === "true") {
        let history = await tblHistoryPT.sequelize.query(
          "SELECT tblMembers.memberId,tblUsers.fullname AS `PT`,tblClassPts.time,tblClassPts.date,tblClassPts.week,tblClassPts.month,tblClassPts.year,tblRevenues.packagePT,tblRevenues.pricePT,tblRevenues.timesPT FROM `tblHistoryPTs` INNER JOIN `tblMembers` ON tblHistoryPTs.userId = tblMembers.userId LEFT OUTER JOIN tblRevenues ON tblHistoryPTs.revenueId = tblRevenues.id LEFT OUTER JOIN tblClassPts ON tblHistoryPTs.classPtId = tblClassPts.classPtId LEFT OUTER JOIN tblUsers on tblClassPts.ptId = tblUsers.userId ORDER BY `tblClassPts`.`week` ASC, `tblClassPts`.`month` ASC, `tblClassPts`.`date` ASC",
          {
            raw: true,
            type: QueryTypes.SELECT,
          }
        );

        data = history.filter((x) => moment(`${x.year}-${x.month}-${x.date}`, "YYYY-MM-DD") >= moment(req.query.firstDate, "YYYY-MM-DD") && moment(`${x.year}-${x.month}-${x.date}`, "YYYY-MM-DD") <= moment(req.query.endDate, "YYYY-MM-DD"));
      } else if (req.query.schedule === "true") {
        let history = await tblHistoryPT.sequelize.query(
          "SELECT member.nickname AS `Member`,tblUsers.fullname AS `PT`,tblClassPts.time,tblClassPts.date,tblClassPts.week,tblClassPts.month,tblClassPts.year FROM `tblHistoryPTs`  INNER JOIN tblUsers AS `member` ON tblHistoryPTs.userId = member.userId LEFT OUTER JOIN tblClassPts ON tblHistoryPTs.classPtId = tblClassPts.classPtId LEFT OUTER JOIN tblUsers on tblClassPts.ptId = tblUsers.userId",
          {
            raw: true,
            type: QueryTypes.SELECT,
          }
        );
        let todayData = history.filter((x) => moment(`${x.year}-${x.month}-${x.date}`).format("YYYY-MM-DD") === req.query.day).sort((a, b) => a.time - b.time);

        let tmpData = [];
        let openTime = 13;
        let closeTime = 21;

        for (let i = openTime; i < closeTime; i++) {
          let time = {
            time: i < 10 ? `0${i}:00 - 0${i + 1}:00` : `${i}:00 - ${i + 1}:00`,
            partisipan: todayData.filter((x) => +x.time.slice(0, 2) === i),
          };
          tmpData.push(time);
        }
        data = tmpData;
      } else {
        data = await tblHistoryPT.findAll({
          where: {
            userId: req.query.userId ? req.query.userId : req.user.userId,
          },
          include: [
            {
              model: tblClassPt,
              include: [{ model: tblUser }],
            },
          ],
        });

        await data.sort(compareTime);
        await data.sort(compareDate);
        await data.sort(compareWeek);
        await data.sort(compareMonth);
        await data.sort(compareYear);
      }
      if (data) res.status(200).json({ message: "Success", totalRecord: data.length, data });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  static async findOne(req, res, next) {
    try {
      let data = await tblHistoryPT.findByPk(req.params.id, {
        include: [
          {
            model: tblClassPt,
            include: [{ model: tblUser }],
          },
        ],
      });

      if (!data) throw { name: "notFound" };
      res.status(200).json({ message: "Success", data });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      let newData = {
        catatan: req.body.catatan,
        hasJoined: req.body.hasJoined,
      };

      await tblHistoryPT.update(newData, { where: { id: req.params.id } });

      let dataReturn = await tblHistoryPT.findByPk(req.params.id, {
        include: [{ model: tblUser }],
      });

      if (!dataReturn) throw { name: "notFound" };

      res.status(200).json({ message: "Success", data: dataReturn });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      let cancelClass;
      cancelClass = await tblHistoryPT.destroy({ where: { id: req.params.id } });

      if (!cancelClass) throw { name: "notFound" };
      res.status(200).json({ message: "Success", idDeleted: req.params.id });

      let member = await tblMember.findOne({ where: { userId: req.user.userId } });
      await tblMember.update(
        {
          ptSession: member.ptSession + 1,
          sisaLastPTSession: member.sisaLastPTSession == null ? null : member.sisaLastPTSession + 1,
          activeDatePackagePT: member.sisaLastPTSession + 1 === 1 ? null : member.activeDatePackagePT,
        },
        { where: { userId: req.user.userId } }
      );

      let revenue = await tblRevenue.findAll({
        where: {
          [Op.and]: [{ memberId: member.memberId }, { packagePT: { [Op.not]: null } }],
        },
        order: [["updatedAt", "DESC"]],
      });

      if (revenue.length && revenue[0].dateActivePT && revenue[0].PTTerpakai !== null && revenue[0].isDone !== null) {
        let revenueData = {
          dateActivePT: revenue[0].PTTerpakai - 1 === 0 ? null : revenue[0].dateActivePT,
          PTTerpakai: revenue[0].PTTerpakai - 1,
          isDone: false,
        };

        await tblRevenue.update(revenueData, { where: { id: revenue[0].id } });
      }
    } catch (error) {
      next(error);
    }
  }
}

function compareYear(a, b) {
  if (Number(a.tblClassPt.year) < Number(b.tblClassPt.year)) {
    return -1;
  }
  if (Number(a.tblClassPt.year) > Number(b.tblClassPt.year)) {
    return 1;
  }
  return 0;
}

function compareMonth(a, b) {
  if (Number(a.tblClassPt.month) < Number(b.tblClassPt.month)) {
    return -1;
  }
  if (Number(a.tblClassPt.month) > Number(b.tblClassPt.month)) {
    return 1;
  }
  return 0;
}

function compareWeek(a, b) {
  if (Number(a.tblClassPt.week) < Number(b.tblClassPt.week)) {
    return -1;
  }
  if (Number(a.tblClassPt.week) > Number(b.tblClassPt.week)) {
    return 1;
  }
  return 0;
}

function compareDate(a, b) {
  if (Number(a.tblClassPt.date) < Number(b.tblClassPt.date)) {
    return -1;
  }
  if (Number(a.tblClassPt.date) > Number(b.tblClassPt.date)) {
    return 1;
  }
  return 0;
}

function compareTime(a, b) {
  if (a.tblClassPt.time < b.tblClassPt.time) {
    return -1;
  }
  if (a.tblClassPt.time > b.tblClassPt.time) {
    return 1;
  }
  return 0;
}

module.exports = historyPT;
