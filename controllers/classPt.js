const { tblClassPt, tblUser, tblHistoryPT, tblMember, tblTransaction, tblOrderList, tblPackageMemberships, tblRevenue } = require("../models");
const Op = require("sequelize").Op;
const { getWeek } = require("../helpers/getNumberOfWeek");
const { createDateAsUTC } = require("../helpers/convertDate");

class classPtsController {
  static async create(req, res, next) {
    try {
      let dataReturn;
      let newClass = {
        ptId: req.user.userId,
        time: req.body.time,
        date: req.body.date,
        week: req.body.week,
        month: req.body.month,
        year: req.body.year,
        isOnline: req.body.isOnline,
      };

      let check = await tblClassPt.findOne({
        where: {
          ptId: req.user.userId,
          time: req.body.time,
          date: req.body.date,
          week: req.body.week,
          month: req.body.month,
          year: req.body.year,
        },
      });

      if (!check) {
        let createClass = await tblClassPt.create(newClass);

        dataReturn = await tblClassPt.findByPk(createClass.classPtId, {
          include: [{ model: tblClassPt }],
        });

        res.status(201).json({ message: "Success", data: dataReturn });
      } else {
        throw { name: "scheduleOn" };
      }
    } catch (error) {
      next(error);
    }
  }

  static async findAll(req, res, next) {
    let data;
    try {
      if (req.query.all === "true") {
        //for option in home member
        let hour = Number(req.query.hour);

        if (hour < 10) hour = `0${hour}:00:00`;
        else hour = `${hour}:00:00`;

        data = await tblClassPt.findAll({
          where: {
            [Op.or]: [
              {
                [Op.and]: [{ time: { [Op.gte]: hour } }, { date: { [Op.gte]: Number(req.query.date.slice(8, 10)) } }, { week: getWeek(req.query.date) }, { year: { [Op.gte]: req.query.date.slice(0, 4) } }],
              },
              {
                [Op.and]: [
                  // { date: { [Op.gt]: Number(req.query.date.slice(8, 10)) } }, UNCOMMENT SINI KALO ERROR PT PERUBAHAN TGL 29 SEPT
                  { week: { [Op.gte]: getWeek(req.query.date) } },
                  { year: { [Op.gte]: req.query.date.slice(0, 4) } },
                ],
              },
            ],
          },
          include: [{ model: tblUser }, { model: tblHistoryPT }],
          order: [
            ["year", "ASC"],
            ["month", "ASC"],
            ["week", "ASC"],
            ["date", "ASC"],
            ["time", "ASC"],
          ],
        });
      } else {
        data = await tblClassPt.findAll({
          where: {
            ptId: req.user.userId,
            week: req.query.week,
            year: req.query.year,
          },
          include: [{ model: tblUser }, { model: tblHistoryPT, include: [{ model: tblUser }] }],
          order: [
            ["year", "ASC"],
            ["month", "ASC"],
            ["week", "ASC"],
            ["time", "ASC"],
          ],
        });
      }
      if (data) res.status(200).json({ message: "Success", totalRecord: data.length, data });
    } catch (error) {
      next(error);
    }
  }

  static async findOne(req, res, next) {
    try {
      let data = await tblClassPt.findByPk(req.params.id, {
        include: [{ model: tblUser }],
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
        linkZoom: req.body.linkZoom,
      };

      await tblClassPt.update(newData, { where: { classPtId: req.params.id } });

      let dataReturn = await tblClassPt.findByPk(req.params.id, {
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
      let deleteClass;
      deleteClass = await tblClassPt.destroy({
        where: { classPtId: req.params.id },
      });

      if (!deleteClass) throw { name: "notFound" };
      res.status(200).json({ message: "Success", idDeleted: req.params.id });
    } catch (error) {
      next(error);
    }
  }

  static async joinClass(req, res, next) {
    try {
      // add validation for hour + pt

      // clg token === id user
      let member = await tblMember.findOne({
        where: { userId: req.user.userId },
      });

      if (member.ptSession > 0) {
        //! this is bug
        let revenue = await tblRevenue.findAll({
          where: {
            [Op.and]: [{ memberId: member.memberId }, { packagePT: { [Op.not]: null } }, { isDone: { [Op.not]: true } }],
          },
          order: [["id", "ASC"]],
        });

        let transaction = await checkTransaction(req.user.userId);

        // cek data historyPT jika ada yang kembar
        let cekDataHistory = await tblHistoryPT.findOne({
          where: {
            [Op.and]: [
              {
                classPtId: req.params.id,
              },
              {
                userId: req.user.userId,
              },
            ],
          },
        });

        if (cekDataHistory) throw { name: "notFound" };

        let newData = {
          userId: req.user.userId,
          classPtId: req.params.id,
          transactionId: transaction || null,
          // revenueId: revenue.length ? revenue[0].id : null,
          revenueId: revenue[0].id,
        };

        let joinPtClass = await tblHistoryPT.create(newData);

        let dataReturn = await tblClassPt.findByPk(joinPtClass.dataValues.classPtId);

        let updateData = {
          ptSession: member.ptSession - 1,
          sisaLastPTSession: member.sisaLastPTSession == null ? null : member.sisaLastPTSession - 1 < 0 ? 0 : member.sisaLastPTSession - 1,
          activeDatePackagePT: member.sisaLastPTSession - 1 < 0 ? createDateAsUTC(new Date(`${dataReturn.year}-${dataReturn.month}-${dataReturn.date}`)) : member.activeDatePackagePT,
        };

        await tblMember.update(updateData, { where: { userId: req.user.userId } });

        if (revenue.length) {
          let revenueData;
          if (revenue[0].PTTerpakai && revenue[0].isDone === false) {
            revenueData = {
              PTTerpakai: revenue[0].PTTerpakai + 1,
              isDone: revenue[0].PTTerpakai + 1 === revenue[0].timesPT ? true : false,
              activePtExpired: revenue[0].PTTerpakai + 1 === revenue[0].timesPT ? createDateAsUTC(new Date(`${dataReturn.year}-${dataReturn.month}-${dataReturn.date}`)) : null,
            };
          } else if (!revenue[0].dateActivePT && !revenue[0].PTTerpakai && revenue[0].isDone === null) {
            revenueData = {
              dateActivePT: createDateAsUTC(new Date(`${dataReturn.year}-${dataReturn.month}-${dataReturn.date}`)),
              PTTerpakai: 1,
              isDone: false,
            };
          } else if (member.sisaLastPTSession - 1 < 0) {
            revenueData = {
              dateActivePT: !revenue[0].dateActivePT ? createDateAsUTC(new Date(`${dataReturn.year}-${dataReturn.month}-${dataReturn.date}`)) : revenue[0].dateActivePT,
              PTTerpakai: !revenue[0].PTTerpakai ? 1 : revenue[0].PTTerpakai + 1,
              isDone: revenue[0].PTTerpakai + 1 === revenue[0].timesPT ? true : false,
              activePtExpired: revenue[0].PTTerpakai + 1 === revenue[0].timesPT ? createDateAsUTC(new Date(`${dataReturn.year}-${dataReturn.month}-${dataReturn.date}`)) : null,
            };
          }
          await tblRevenue.update(revenueData, { where: { id: revenue[0].id } });
        }
        res.status(200).json({ message: "Success", data: joinPtClass });
      } else throw { name: "sessionDone" };
    } catch (error) {
      next(error);
    }
  }

  static async cancelJoinClass(req, res, next) {
    try {
      await tblHistoryPT.destroy({ where: { id: req.params.id } });

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

      let revenueData = {
        dateActivePT: revenue[0].PTTerpakai - 1 === 0 ? null : revenue[0].dateActivePT,
        PTTerpakai: revenue[0].PTTerpakai - 1,
        isDone: false,
        activePtExpired: null,
      };

      if (revenue.length) await tblRevenue.update(revenueData, { where: { id: revenue[0].id } });

      res.status(200).json({ message: "Success", idDeleted: req.params.id });
    } catch (error) {
      next(error);
    }
  }
}

async function checkTransaction(userId) {
  let member = await tblMember.findOne({ where: { userId } });

  let transaction = await tblTransaction.findAll({
    where: { status: "paid", memberId: member.memberId },
    include: [
      {
        model: tblOrderList,
        where: { categoryMembershipId: 2 },
        include: [{ model: tblPackageMemberships }],
        order: [["id", "ASC"]],
      },
    ],
    order: [["transactionId", "DESC"]],
    limit: 5,
  });

  let tempPTSession = +member.ptSession,
    packageSelected,
    trans;
  await transaction.forEach(async (element) => {
    if (tempPTSession > 0) {
      await element.tblOrderList.forEach((el) => {
        if (tempPTSession > 0) {
          let newRemainingPTSession = tempPTSession - +el.quantity * +el.tblPackageMembership.times;
          tempPTSession = newRemainingPTSession;
          if (newRemainingPTSession < 0) {
            packageSelected = el.tblPackageMembership;
            trans = element;
          }
        }
      });
    }
  });

  if (trans) return trans.transactionId;
  else return null;
}

module.exports = classPtsController;
