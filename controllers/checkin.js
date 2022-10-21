const { tblCheckinCheckouts, tblUser, tblStaff, tblMember, tblCancelReservation, tblSubCategoryMembership } = require("../models");
const Op = require("sequelize").Op;
const { log } = require("../helpers/log");
const { createDateAsUTC } = require("../helpers/convertDate");
const { cancelReservation } = require("../helpers/schedule");
const moment = require("moment");
let jamPrivateGym = 0;
let batasJamPrivateGym = 0;

class checkinController {
  static async create(req, res, next) {
    let userCheckin;
    try {
      if (req.body.isReservation) {
        if (await checkSlotGym(req.body.reservationDate, req.body.reservationTime, req.user.userId)) {
          if (moment(new Date(req.body.reservationDate)).isoWeekday() > 5) {
            jamPrivateGym = 0;
            batasJamPrivateGym = 0;
          }
          let newUserCheckin = {
            userId: req.user.userId,
            date: req.body.reservationDate ? req.body.reservationDate : createDateAsUTC(new Date()),
            isReservation: 1,
          };
          if (new Date(req.body.reservationDate).getDate() === new Date().getDate() && new Date(req.body.reservationDate).getMonth() === new Date().getMonth()) {
            if (new Date().getHours() === Number(req.body.reservationTime.slice(0, 2))) {
              let minute = new Date().getMinutes() < 10 ? `0${new Date().getMinutes()}` : new Date().getMinutes();
              newUserCheckin.reservationTime = `${req.body.reservationTime.slice(0, 2)}:${minute}:00`;
            } else {
              newUserCheckin.reservationTime = req.body.reservationTime;
            }
          } else {
            newUserCheckin.reservationTime = req.body.reservationTime;
          }

          if (+req.body.reservationTime.slice(0, 2) === jamPrivateGym) {
            let member = await tblMember.findOne({
              where: { userId: req.user.userId },
            });

            if (member.PG_Session > 0) {
              let data = {
                PG_Session: member.PG_Session - 1,
              };

              await tblMember.update(data, { where: { userId: req.user.userId } });
            } else throw { name: "nullPG" };
          }
          userCheckin = await tblCheckinCheckouts.create(newUserCheckin);

          let date = new Date(
            new Date(newUserCheckin.date).getFullYear(),
            new Date(newUserCheckin.date).getMonth(),
            new Date(newUserCheckin.date).getDate(),
            Number(newUserCheckin.reservationTime.slice(0, 2)),
            Number(newUserCheckin.reservationTime.slice(3, 5)) + 1
          );

          if (+req.body.reservationTime.slice(0, 2) !== jamPrivateGym) {
            cancelReservation(userCheckin.null, date);
          }
        } else {
          throw { name: "fullBook" };
        }
      } else {
        let date = new Date().getDate() < 10 ? `0${new Date().getDate()}` : new Date().getDate();
        let month = new Date().getMonth() + 1 < 10 ? `0${new Date().getMonth() + 1}` : new Date().getMonth() + 1;
        let hour = new Date().getHours() < 10 ? `0${new Date().getHours()}:00:00` : `${new Date().getHours()}:00:00`;

        if (await checkSlotGym(`${new Date().getFullYear()}-${month}-${date}`, hour, req.body.userId)) {
          let cekLockerKey = await tblCheckinCheckouts.findOne({
            where: { lockerKey: req.body.lockerKey },
          });
          if (cekLockerKey && +cekLockerKey.lockerKey) {
            throw { name: "fullBook" };
          } else {
            let dataMembers = await tblMember.findOne({
              where: { userId: req.body.userId },
            });
            if (dataMembers) {
              let memberUpdateData;

              if (!dataMembers.activeDate) {
                memberUpdateData = {
                  activeDate: createDateAsUTC(new Date()),
                  lastCheckin: createDateAsUTC(new Date()),
                };
                // comment line semua isi di if ini kalo mau trial jadi satu hari
                if (dataMembers.packageMembershipId === "Trial") {
                  let { access } = await tblSubCategoryMembership.findOne({
                    where: { categoryMembershipId: 3 },
                  });
                  if (access === "Sesi") memberUpdateData.activeExpired = createDateAsUTC(new Date());
                }
                await tblUser.update({ flagActive: true }, { where: { userId: dataMembers.userId } });
              } else {
                memberUpdateData = { lastCheckin: createDateAsUTC(new Date()) };
              }

              await tblMember.update(memberUpdateData, {
                where: { userId: dataMembers.userId },
              });
            }

            let newUserCheckin = {
              userId: req.body.userId,
              adminIdCheckin: req.user.userId,
              lockerKey: req.body.lockerKey,
              noBottle: req.body.noBottle,
              checkinTime: createDateAsUTC(new Date()),
              date: createDateAsUTC(new Date()),
            };

            userCheckin = await tblCheckinCheckouts.create(newUserCheckin);
          }
        } else {
          throw { name: "fullBook" };
        }
      }

      res.status(201).json({ message: "Success", data: userCheckin });

      let newData = {
        userId: req.user.userId,
        url: `http://megafit.co.id/checkin-checkout`,
        method: "post",
        status: 201,
        message: "",
      };
      log(newData);
    } catch (error) {
      next(error);
    }
  }

  static async findAll(req, res, next) {
    let query = "",
      data;
    try {
      if (req.query.checkin === "true") {
        query = query + "?checkin=true";

        let prevHour = Number(req.query.time.slice(0, 2)) - 1 < 10 ? `0${Number(req.query.time.slice(0, 2)) - 1}` : Number(req.query.time.slice(0, 2)) - 1;
        let nextHour = Number(req.query.time.slice(0, 2)) + 1 < 10 ? `0${Number(req.query.time.slice(0, 2)) + 1}` : Number(req.query.time.slice(0, 2)) + 1;

        data = await tblCheckinCheckouts.findAll({
          where: {
            [Op.or]: [
              {
                [Op.and]: [
                  { checkoutTime: null },
                  { date: new Date(req.query.date) },
                  {
                    [Op.or]: [
                      {
                        [Op.and]: [{ checkinTime: { [Op.gte]: `${prevHour}:00:00` } }, { checkinTime: { [Op.lt]: `${nextHour}:00:00` } }],
                      },
                      {
                        [Op.and]: [{ reservationTime: { [Op.gte]: `${prevHour}:00:00` } }, { reservationTime: { [Op.lt]: `${nextHour}:00:00` } }],
                      },
                    ],
                  },
                ],
              },
              {
                [Op.and]: [
                  { checkoutTime: null },
                  { date: new Date(req.query.date) },
                  {
                    checkinTime: {
                      [Op.lte]: `${req.query.time.slice(0, 2)}:00:00`,
                    },
                  },
                ],
              },
              {
                [Op.and]: [
                  { checkoutTime: null },
                  // { isReservation: { [Op.not]: true } },
                  { date: { [Op.lt]: new Date(req.query.date) } },
                  { checkinTime: { [Op.not]: null } },
                ],
              },
              // {
              //   [Op.and]: [
              //     {isReservation: true},
              //     {reservationTime: '10:00:00'},
              //     {checkoutTime: {[Op.is]: null}},
              //   ],
              // },
            ],
          },
          include: [{ model: tblUser, as: "member", include: { model: tblMember } }],
        });
      } else if (req.query["for-option-member"] === "true") {
        if (moment(new Date(req.query.date)).isoWeekday() > 5) {
          jamPrivateGym = 0;
          batasJamPrivateGym = 0;
        }
        let tempData = [];

        let dataCheckin = await tblCheckinCheckouts.findAll({
          where: {
            checkoutTime: null,
            date: new Date(req.query.date),
          },
        });

        for (let i = 6; i <= 21; i++) {
          let hour = i < 10 ? `0${i}` : i;
          let hourA = i - 1 < 10 ? `0${i - 1}` : i - 1;
          let hourB = i + 1 < 10 ? `0${i + 1}` : i + 1;
          let hourC = i + 2 < 10 ? `0${i + 2}` : i + 2;

          let data1 = await dataCheckin.filter((checkin) => (checkin.checkinTime >= `${hourA}:00:00` && checkin.checkinTime < `${hourB}:00:00`) || (checkin.reservationTime >= `${hourA}:00:00` && checkin.reservationTime < `${hourB}:00:00`));
          let data2 = await dataCheckin.filter((checkin) => (checkin.checkinTime >= `${hour}:00:00` && checkin.checkinTime < `${hourC}:00:00`) || (checkin.reservationTime >= `${hour}:00:00` && checkin.reservationTime < `${hourC}:00:00`));

          let limit = i < batasJamPrivateGym ? 1 : 23;

          let dataHour = {
            hour: `${hour}:00:00`,
            isAvailable: data1.length >= limit || data2.length >= limit ? false : true,
          };

          tempData.push(dataHour);
        }
        data = tempData;
      } else if (req.query.laporan === "true") {
        let history = await tblCheckinCheckouts.findAll({
          where: {
            [Op.and]: [{ date: { [Op.gte]: new Date(req.query.firstDate) } }, { date: { [Op.lte]: new Date(req.query.endDate) } }],
          },
          include: [
            {
              model: tblUser,
              as: "member",
              attributes: ["userId"],
              include: [{ model: tblMember, attributes: ["memberId"] }],
            },
            { model: tblUser, as: "admin_checkin", attributes: ["nickname"] },
            { model: tblUser, as: "admin_checkout", attributes: ["nickname"] },
          ],
          raw: true,
          nest: true,
        });

        await history.forEach((x) => {
          x.member = x.member.tblMember.memberId;
          x.admin_checkin = x.admin_checkin.nickname;
          x.admin_checkout = x.admin_checkout.nickname;
          x.createdAt = moment(x.createdAt).format("YYYY-MM-DD HH:mm");
        });

        data = history;
      } else {
        data = await tblCheckinCheckouts.findAll({
          include: [
            { model: tblUser, as: "member" },
            { model: tblUser, as: "admin_checkin" },
            { model: tblUser, as: "admin_checkout" },
          ],
        });
      }

      res.status(200).json({ message: "Success", totalRecord: data.length, data });

      let newData = {
        userId: req.user.userId,
        url: `http://localhost:3500/checkin-checkout${query}`,
        method: "get",
        status: 200,
        message: "",
      };
      log(newData);
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    let query = "";

    try {
      if (req.query.lockerKey === "true") {
        // GIVE BACK LOCKER KEY
        query = query + "?lockerKey=true";

        let userCheckinUpdate = await tblCheckinCheckouts.update({ lockerKey: 0 }, { where: { checkId: req.params.id } });
        let dataReturn = await tblCheckinCheckouts.findByPk(req.params.id, {
          include: [
            {
              model: tblUser,
              as: "member",
              include: [{ model: tblStaff, as: "staff" }, { model: tblMember }],
            },
          ],
        });

        if (userCheckinUpdate) throw { name: "notFound" };
        res.status(200).json({ message: "Success", data: dataReturn });
      } else if (req.query.noBottle === "true") {
        let userCheckinUpdate = await tblCheckinCheckouts.update({ noBottle: 0 }, { where: { checkId: req.params.id } });

        let dataReturn = await tblCheckinCheckouts.findByPk(req.params.id, {
          include: [
            {
              model: tblUser,
              as: "member",
              include: [{ model: tblStaff, as: "staff" }, { model: tblMember }],
            },
          ],
        });
        if (userCheckinUpdate) res.status(200).json({ message: "Success", data: dataReturn });
      } else if (req.query.checkin === "true") {
        //HAS RESERVATION WANT TO CHECKIN
        let cekLockerKey = await tblCheckinCheckouts.findOne({
          where: { lockerKey: req.body.lockerKey },
        });
        if (cekLockerKey && +cekLockerKey.lockerKey) {
          throw { name: "fullBook" };
        } else {
          let newUserCheckinUpdate = {
            adminIdCheckin: req.user.userId,
            lockerKey: req.body.lockerKey,
            noBottle: req.body.noBottle,
            checkinTime: createDateAsUTC(new Date()),
          };

          let userCheckinUpdate = await tblCheckinCheckouts.update(newUserCheckinUpdate, {
            where: { checkId: req.params.id },
          });
          let dataReturn = await tblCheckinCheckouts.findByPk(req.params.id, {
            include: [
              {
                model: tblUser,
                as: "member",
                include: [{ model: tblStaff, as: "staff" }, { model: tblMember }],
              },
            ],
          });
          let dataMembers = await tblMember.findOne({
            where: { userId: dataReturn.userId },
          });
          if (dataMembers) {
            let memberUpdateData;

            if (!dataMembers.activeDate) {
              memberUpdateData = {
                activeDate: createDateAsUTC(new Date()),
                lastCheckin: createDateAsUTC(new Date()),
              };
              // comment line semua isi di if ini kalo mau trial jadi satu hari
              if (dataMembers.packageMembershipId === "Trial") {
                let { access } = await tblSubCategoryMembership.findOne({
                  where: { categoryMembershipId: 3 },
                });
                if (access === "Sesi") memberUpdateData.activeExpired = createDateAsUTC(new Date());
              }
              await tblUser.update({ flagActive: true }, { where: { userId: dataMembers.userId } });
            } else {
              memberUpdateData = { lastCheckin: createDateAsUTC(new Date()) };
            }

            await tblMember.update(memberUpdateData, {
              where: { userId: dataMembers.userId },
            });
          }

          if (!userCheckinUpdate) throw { name: "notFound" };
          res.status(200).json({ message: "Success", data: dataReturn });
        }
      } else {
        //FOR CHECKOUT
        let newUserCheckinUpdate = {
          adminIdCheckout: req.user.userId,
          checkoutTime: createDateAsUTC(new Date()),
        };

        if (req.body.lockerKey) newUserCheckinUpdate.lockerKey = 0;
        if (req.body.noBottle) newUserCheckinUpdate.noBottle = 0;

        let userCheckinUpdate = await tblCheckinCheckouts.update(newUserCheckinUpdate, {
          where: { checkId: req.params.id },
        });
        let dataReturn = await tblCheckinCheckouts.findByPk(req.params.id, {
          include: [
            {
              model: tblUser,
              as: "member",
              include: [{ model: tblStaff, as: "staff" }, { model: tblMember }],
            },
          ],
        });

        if (!userCheckinUpdate) throw { name: "notFound" };
        res.status(200).json({ message: "Success", data: dataReturn });
      }

      let newData = {
        userId: req.user.userId,
        url: `http://localhost:3500/checkin-checkout/${req.params.id}${query}`,
        method: "put",
        status: 200,
        message: "",
      };
      log(newData);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      let deleteCheckin;

      let checkin = await tblCheckinCheckouts.findByPk(req.params.id);

      if (+checkin.reservationTime.slice(0, 2) === jamPrivateGym) {
        let member = await tblMember.findOne({
          where: { userId: checkin.userId },
        });

        let data = {
          PG_Session: member.PG_Session + 1,
        };

        await tblMember.update(data, { where: { userId: req.user.userId } });
      }

      if (req.query.automated === "true") {
        let member = await tblMember.findOne({
          where: { userId: checkin.userId },
        });

        let dataCancelReservation = {
          memberId: member.memberId,
          reservationDate: checkin.date,
          reservationTime: checkin.reservationTime,
        };

        await tblCancelReservation.create(dataCancelReservation);
      }

      deleteCheckin = await tblCheckinCheckouts.destroy({
        where: { checkId: req.params.id },
      });

      if (!deleteCheckin) throw { name: "notFound" };
      res.status(200).json({ message: "Success", idDeleted: req.params.id });
    } catch (error) {
      next(error);
    }
  }
}

async function checkSlotGym(reservationDate, reservationTime, userId) {
  let dataSlotNow, dataSlotNext;
  let hour = Number(reservationTime.slice(0, 2)) < 10 ? `0${Number(reservationTime.slice(0, 2))}` : Number(reservationTime.slice(0, 2));
  let hourA = Number(reservationTime.slice(0, 2)) - 1 < 10 ? `0${Number(reservationTime.slice(0, 2)) - 1}` : Number(reservationTime.slice(0, 2)) - 1;
  let hourB = Number(reservationTime.slice(0, 2)) + 1 < 10 ? `0${Number(reservationTime.slice(0, 2)) + 1}` : Number(reservationTime.slice(0, 2)) + 1;
  let hourC = Number(reservationTime.slice(0, 2)) + 2 < 10 ? `0${Number(reservationTime.slice(0, 2)) + 2}` : Number(reservationTime.slice(0, 2)) + 2;

  dataSlotNow = await tblCheckinCheckouts.findAll({
    where: {
      [Op.and]: [
        { checkoutTime: null },
        { date: new Date(reservationDate) },
        {
          [Op.or]: [
            {
              [Op.and]: [{ checkinTime: { [Op.gte]: `${hourA}:00:00` } }, { checkinTime: { [Op.lt]: `${hourB}:00:00` } }],
            },
            {
              [Op.and]: [{ reservationTime: { [Op.gte]: `${hourA}:00:00` } }, { reservationTime: { [Op.lt]: `${hourB}:00:00` } }],
            },
          ],
        },
      ],
    },
  });

  dataSlotNext = await tblCheckinCheckouts.findAll({
    where: {
      [Op.and]: [
        { checkoutTime: null },
        { date: new Date(reservationDate) },
        {
          [Op.or]: [
            {
              [Op.and]: [{ checkinTime: { [Op.gte]: `${hour}:00:00` } }, { checkinTime: { [Op.lt]: `${hourC}:00:00` } }],
            },
            {
              [Op.and]: [{ reservationTime: { [Op.gte]: `${hour}:00:00` } }, { reservationTime: { [Op.lt]: `${hourC}:00:00` } }],
            },
          ],
        },
      ],
    },
  });

  let checkMemberHasReservationNow = dataSlotNow.find((el) => el.userId === userId);
  // let checkMemberHasReservatioNext = dataSlotNow.find(el => el.userId === userId )

  let limit = Number(reservationTime.slice(0, 2)) < batasJamPrivateGym ? 1 : 23;

  if ((dataSlotNow.length >= limit || dataSlotNext.length >= limit) && !checkMemberHasReservationNow) return false;
  else return true;
}

module.exports = checkinController;
