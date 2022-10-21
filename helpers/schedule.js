const schedule = require("node-schedule");
const Op = require("sequelize").Op;
const { createDateAsUTC } = require("./convertDate");
const { sendEmailRememberMembership } = require("./nodemailer");
const { QueryTypes } = require("sequelize");
const moment = require("moment");
const { tblCheckinCheckouts, tblTransaction, tblMember, tblPackageMemberships, tblSubCategoryMembership, tblUser, tblRevenue, tblCancelReservation } = require("../models");

async function rescheduleCRON() {
  await handleReservation();
  await handleActiveLeave();
  await handleInactiveLeave();
  await handleTransactionExpired();
  await handleRememberPackage();
  await handleDeklarasiKesehatan();
  await handleMemberBelumAktif();
  await handleKreditMember();
  // await handleCashlez();
  // await handleCancelCashlez();
  // await handleCekDuplicateRevenue();
}

// ====================== MEMBERSHIP (START) ======================
async function rememberExtendPackage(memberId) {
  let oldDataMember = await tblMember.findByPk(memberId, {
    include: [{ model: tblUser }],
  });
  if (oldDataMember) {
    let date = new Date(new Date(oldDataMember.activeExpired).setDate(new Date(oldDataMember.activeExpired).getDate() - 7));
    schedule.scheduleJob(date, async function () {
      let newDataMember = await tblMember.findByPk(memberId);
      if (newDataMember && "" + newDataMember.activeExpired === "" + oldDataMember.activeExpired && !newDataMember.isFreeze) {
        await sendEmailRememberMembership(oldDataMember.tblUser.nickname, oldDataMember.tblUser.email, getDate(oldDataMember.activeExpired));
        await rememberNonActiveMembership(memberId);
        console.log("rememberExtendPackage Sukses", memberId, createDateAsUTC(new Date()));
      } else {
        console.log(`rememberExtendPackage Tidak Sukses, membership has update `, memberId, createDateAsUTC(new Date()));
      }
    });
  }
}
async function rememberNonActiveMembership(memberId) {
  let oldDataMember = await tblMember.findByPk(memberId, {
    include: [{ model: tblUser }],
  });
  if (oldDataMember) {
    console.log("schedule rememberNonActiveMembership", memberId, createDateAsUTC(new Date()));
    let date = new Date(oldDataMember.activeExpired);

    schedule.scheduleJob(date, async function () {
      let newDataMember = await tblMember.findByPk(memberId);
      if (newDataMember && "" + newDataMember.activeExpired === "" + oldDataMember.activeExpired && !newDataMember.isFreeze) {
        await sendEmailRememberMembership(oldDataMember.tblUser.nickname, oldDataMember.tblUser.email, getDate(oldDataMember.activeExpired), "non active");
        await nonActiveMembership(memberId, oldDataMember.activeExpired);
        console.log("rememberNonActiveMembership Sukses", memberId, createDateAsUTC(new Date()));
      } else {
        console.log(`rememberNonActiveMembership Tidak Sukses, membership has update`, memberId, createDateAsUTC(new Date()));
      }
    });
  }
}

async function nonActiveMembership(memberId, activeExpired) {
  console.log("schedule nonActiveMembership", memberId, createDateAsUTC(new Date()));
  let date = new Date(new Date(activeExpired).setDate(new Date(activeExpired).getDate() + 7));

  schedule.scheduleJob(date, async function () {
    let newDataMember = await tblMember.findByPk(memberId, {
      include: [{ model: tblUser }],
    });
    if (newDataMember && "" + newDataMember.activeExpired === "" + newDataMember.activeExpired) {
      await tblUser.update({ flagActive: 0 }, { where: { userId: newDataMember.tblUser.userId } });
      console.log("nonActiveMembership Sukses", memberId, createDateAsUTC(new Date()));
    } else {
      console.log(`nonActiveMembership Tidak Sukses, membership has update`, memberId, createDateAsUTC(new Date()));
    }
  });
}

async function handleRememberPackage() {
  schedule.scheduleJob("* * * * *", async function () {
    let allMember = await tblUser.findAll({
      where: { flagActive: 1 },
      include: [
        {
          required: true,
          model: tblMember,
        },
      ],
    });

    await allMember.forEach(async (member) => {
      let hMinus7ActiveExpired = new Date(new Date(member.tblMember.activeExpired).setDate(new Date(member.tblMember.activeExpired).getDate() - 7));
      let hPlus7ActiveExpired = new Date(new Date(member.tblMember.activeExpired).setDate(new Date(member.tblMember.activeExpired).getDate() + 7));

      if (hMinus7ActiveExpired > new Date()) {
        await rememberExtendPackage(member.tblMember.memberId);
      } else if (new Date(member.tblMember.activeExpired) > new Date()) {
        await rememberNonActiveMembership(member.tblMember.memberId);
      } else if (hPlus7ActiveExpired > new Date()) {
        await nonActiveMembership(member.tblMember.memberId, member.tblMember.activeExpired);
      } else {
        if (member.flagActive) {
          console.log("Nonactive success", member.tblMember.memberId, createDateAsUTC(new Date()));
          await tblUser.update({ flagActive: 0 }, { where: { userId: member.userId } });
        }
      }
    });
  });
}
// ======================  MEMBERSHIP (END)  ======================

// ====================== ACTIVE LEAVE (START) ======================
async function handleActiveLeave() {
  schedule.scheduleJob("* * * * *", async function () {
    let members = await tblMember.findAll({
      where: {
        [Op.and]: [
          {
            isFreeze: { [Op.not]: true },
          },
          { isLeave: { [Op.not]: true } },
          { leaveDate: { [Op.not]: null } },
          { leaveStatus: "PAID" },
        ],
      },
    });

    let packageLeave = await tblSubCategoryMembership.findOne({
      include: [{ model: tblPackageMemberships }],
      where: { categoryMembershipId: 4 },
    });

    await members.forEach(async (member) => {
      if (new Date() >= new Date(member.leaveDate) && !member.isLeave) {
        let revenue = await tblRevenue.findAll({
          where: {
            [Op.and]: [
              {
                memberId: member.memberId,
                activeMembershipExpired: {
                  [Op.gte]: createDateAsUTC(new Date()),
                },
                packageAfter: { [Op.not]: null },
                packageAfter: { [Op.not]: "Cuti" },
              },
            ],
          },
          order: [["activeMembershipExpired", "ASC"]],
        });

        let promises = [];

        await revenue.forEach((x) => {
          let updateRevenueData;
          if (moment(x.dateActiveMembership).format("YYYY-MM-DD") < moment().format("YYYY-MM-DD")) {
            updateRevenueData = {
              activeMembershipExpired: createDateAsUTC(new Date()),
              status: "CLOSED",
              pending_saldo: x.debit ? x.debit - x.kredit : x.pending_saldo - x.kredit,
            };
          } else {
            updateRevenueData = {
              dateActiveMembership: createDateAsUTC(new Date(moment(x.dateActiveMembership).add(packageLeave.tblPackageMemberships[0].times, "days").format("YYYY-MM-DD"))),
              activeMembershipExpired: createDateAsUTC(new Date(moment(x.activeMembershipExpired).add(packageLeave.tblPackageMemberships[0].times, "days").format("YYYY-MM-DD"))),
              status: "PENDING",
            };
          }

          // let tempRevenueData = {
          //   ...x.dataValues,
          //   revenueId: x.id,
          // };

          // delete tempRevenueData.id;
          // promises.push(tblTempRevenue.create(tempRevenueData));
          promises.push(tblRevenue.update(updateRevenueData, { where: { id: x.id } }));
        });

        let cutiRevenue = {
          memberId: member.memberId,
          dateActiveMembership: createDateAsUTC(new Date(member.leaveDate)),
          activeMembershipExpired: createDateAsUTC(new Date(moment(member.leaveDate).add(packageLeave.tblPackageMemberships[0].times, "days").format("YYYY-MM-DD"))),
          packageBefore: "Cuti",
          packageAfter: "Cuti",
          times: packageLeave.tblPackageMemberships[0].times,
          debit: packageLeave.tblPackageMemberships[0].times,
          kredit: 0,
          saldo_member: revenue.length ? revenue[revenue.length - 1].saldo_member - revenue[revenue.length - 1].kredit : cekSisaHari(member.activeExpired),
          status: "OPEN",
          keterangan: "Cuti Membership",
          price: packageLeave.tblPackageMemberships[0].price,
          is_event: false,
        };

        promises.push(tblRevenue.create(cutiRevenue));

        promises.push(
          tblMember.update(
            {
              isLeave: 1,
            },
            { where: { memberId: member.memberId } }
          )
        );
        await Promise.all(promises);
      }
    });
  });
}
// ====================== ACTIVE LEAVE (END) ======================

// ====================== ACTIVE AFTER LEAVE (START) ======================
async function handleInactiveLeave() {
  schedule.scheduleJob("15 0 * * *", async function () {
    let members = await tblMember.findAll({
      where: {
        [Op.and]: [{ isLeave: 1 }, { [Op.or]: [{ isFreeze: 0 }, { isFreeze: null }] }],
      },
      order: [["memberId", "ASC"]],
    });

    await members.forEach(async (member) => {
      if (moment(member.leaveDate).add(30, "days") <= moment()) {
        let revenueData = await tblRevenue.findAll({
          where: {
            [Op.and]: [
              {
                memberId: member.memberId,
              },
              {
                packageAfter: { [Op.not]: null },
              },
              {
                packageAfter: { [Op.not]: "Cuti" },
              },
              {
                [Op.or]: [
                  {
                    [Op.and]: [
                      {
                        pending_saldo: { [Op.not]: null },
                      },
                      {
                        pending_saldo: { [Op.not]: 0 },
                      },
                    ],
                  },
                  {
                    status: "PENDING",
                  },
                ],
              },
            ],
          },
          order: [["activeMembershipExpired", "ASC"]],
        });

        let cutiRevenue = await tblRevenue.findOne({
          where: {
            [Op.and]: [
              {
                memberId: member.memberId,
              },
              {
                packageAfter: "Cuti",
              },
              {
                status: "OPEN",
              },
            ],
          },
          order: [["activeMembershipExpired", "ASC"]],
        });

        let promises = [];
        let lastDateExpired = new Date();

        await revenueData.forEach((x) => {
          let updateRevenueData;

          if (x.status === "PENDING") {
            updateRevenueData = {
              dateActiveMembership: createDateAsUTC(lastDateExpired),
              activeMembershipExpired: createDateAsUTC(
                new Date(
                  moment(lastDateExpired)
                    .add(x.debit ? x.debit : x.pending_saldo, "days")
                    .format("YYYY-MM-DD")
                )
              ),
              status: lastDateExpired <= new Date() ? "OPEN" : "PENDING",
            };

            lastDateExpired = updateRevenueData.activeMembershipExpired;
          } else {
            updateRevenueData = {
              pending_saldo: 0,
            };

            let createRevenue = {
              ...x.dataValues,
              dateActiveMembership: createDateAsUTC(new Date()),
              activeMembershipExpired: createDateAsUTC(new Date(moment(lastDateExpired).add(x.pending_saldo, "days").format("YYYY-MM-DD"))),
              debit: 0,
              kredit: 0,
              status: "OPEN",
              keterangan: x.keterangan.split(" ")[0] === "Terusan" ? x.keterangan : "Terusan" + " " + x.keterangan,
              saldo_member: x.saldo_member - x.kredit,
              dateActivePT: null,
              activePtExpired: null,
              packagePT: null,
              timesPT: null,
              PTTerpakai: null,
              isDone: null,
              pricePT: null,
            };

            lastDateExpired = new Date(moment(lastDateExpired).add(x.pending_saldo, "days").format("YYYY-MM-DD"));

            delete createRevenue.id;
            promises.push(tblRevenue.create(createRevenue));
          }

          promises.push(tblRevenue.update(updateRevenueData, { where: { id: x.id } }));
        });

        if (cutiRevenue) {
          await tblRevenue.update(
            {
              status: "CLOSED",
              kredit: cutiRevenue.debit ? cutiRevenue.debit : cutiRevenue.pending_saldo,
              pending_saldo: 0,
              activeMembershipExpired: createDateAsUTC(new Date()),
              last_kredited: createDateAsUTC(new Date()),
            },
            { where: { id: cutiRevenue.id } }
          );
        }

        // promises.push(
        //   tblTempRevenue.destroy({
        //     where: {
        //       memberId: member.memberId,
        //     },
        //   })
        // );
        promises.push(tblMember.update({ isLeave: null, leaveDate: null, leaveStatus: null }, { where: { memberId: member.memberId } }));
        await Promise.all(promises);

        console.log(
          `Member : ${member.memberId} telah berhasil berhenti cuti.\n
          Tanggal Cuti : ${moment(member.leaveDate).format("DD-MM-YYYY")}\n
          Tanggal Aktif :${moment().format("DD-MM-YYYY")}`
        );
      }
    });
  });
}
// ======================  ACTIVE AFTER LEAVE (END)  ======================

// ====================== RESERVATION (START) ======================
async function handleReservation() {
  let date = new Date().getDate() < 10 ? `0${new Date().getDate()}` : new Date().getDate();
  let month = new Date().getMonth() + 1 < 10 ? `0${new Date().getMonth() + 1}` : new Date().getMonth() + 1;
  // let hour = new Date().getHours() < 10 ? `0${new Date().getHours()}` : new Date().getHours();
  // let minute = new Date().getMinutes() < 10 ? `0${new Date().getMinutes()}` : new Date().getMinutes();

  let checkin = await tblCheckinCheckouts.findAll({
    where: {
      isReservation: 1,
      adminIdCheckin: null,
      date: {
        [Op.gte]: new Date(`${new Date().getFullYear()}-${month}-${date}`),
      },
    },
  });

  if (checkin && checkin.length > 0) {
    await checkin.forEach(async (element) => {
      await cancelReservation(element.checkId);
    });
  }
  deleteReservationHasPassed();
}

async function cancelReservation(idCheckin) {
  let checkin = await tblCheckinCheckouts.findByPk(idCheckin);
  if (checkin) {
    console.log("schedule cancelReservation", idCheckin, createDateAsUTC(new Date()));
    let date = new Date(new Date(checkin.date).getFullYear(), new Date(checkin.date).getMonth(), new Date(checkin.date).getDate(), Number(checkin.reservationTime.slice(0, 2)), Number(checkin.reservationTime.slice(3, 5)) + 15);

    schedule.scheduleJob(date, async function () {
      let checkin = await tblCheckinCheckouts.findByPk(idCheckin);
      if (checkin && !checkin.adminIdCheckin) {
        console.log("cancelReservation Sukses", idCheckin, createDateAsUTC(new Date()));
        let member = await tblMember.findOne({
          where: { userId: checkin.userId },
        });

        let dataCancelReservation = {
          memberId: member.memberId,
          reservationDate: checkin.date,
          reservationTime: checkin.reservationTime,
        };

        await tblCancelReservation.create(dataCancelReservation);
        await tblCheckinCheckouts.destroy({ where: { checkId: idCheckin } });
      } else if (checkin && checkin.adminIdCheckin) {
        console.log("cancelReservation Tidak Sukses, has Checkin", idCheckin, createDateAsUTC(new Date()));
      }
    });
  }
}

async function deleteReservationHasPassed() {
  try {
    let date = new Date().getDate() < 10 ? `0${new Date().getDate()}` : new Date().getDate();
    let month = new Date().getMonth() + 1 < 10 ? `0${new Date().getMonth() + 1}` : new Date().getMonth() + 1;
    let hour = new Date().getHours();
    let minute = new Date().getMinutes();

    if (Number(minute) - 15 < 0) {
      minute = 60 - Math.abs(Number(minute) - 15);
      hour = Number(hour) - 1;
    } else {
      minute = Number(minute) - 15;
    }
    minute = minute < 10 ? `0${minute}` : minute;
    hour = hour < 10 ? `0${hour}` : hour;

    console.log(`reservation before ${date}/${month}/${new Date().getFullYear()}, ${hour}:${minute}:00 has deleted`);
    await tblCheckinCheckouts.destroy({
      where: {
        [Op.or]: [
          {
            [Op.and]: [
              { isReservation: 1 },
              { adminIdCheckin: null },
              {
                date: {
                  [Op.lt]: new Date(`${new Date().getFullYear()}-${month}-${date}`),
                },
              },
            ],
          },
          {
            [Op.and]: [
              { isReservation: 1 },
              { adminIdCheckin: null },
              {
                date: new Date(`${new Date().getFullYear()}-${month}-${date}`),
              },
              { reservationTime: { [Op.lte]: `${hour}:${minute}:00` } },
            ],
          },
        ],
      },
    });
  } catch (err) {
    console.log(createDateAsUTC(new Date()), {
      Error: "deleteReservationHasPassed",
    });
  }
}
// ======================  RESERVATION (END)  ======================

// ======================  TRANSACTION (START)  ======================
async function handleTransactionExpired() {
  try {
    schedule.scheduleJob("* * * * *", async function () {
      let date = new Date().getDate() < 10 ? `0${new Date().getDate()}` : new Date().getDate();
      let month = new Date().getMonth() + 1 < 10 ? `0${new Date().getMonth() + 1}` : new Date().getMonth() + 1;
      let hour = new Date().getHours();
      let minute = new Date().getMinutes();

      let data = {
        status: "cancelled",
        deniedReason: "Dibatalkan otomatis oleh sistem.",
        expiredAt: null,
      };

      let cancelled = await tblTransaction.findAll({
        where: {
          expiredAt: { [Op.lte]: createDateAsUTC(new Date()) },
          status: "unpaid",
        },
      });

      await cancelled.forEach(async (element) => {
        let success = await tblTransaction.update(data, {
          where: { transactionId: element.transactionId },
        });
        await tblMember.update({ isLeave: null, leaveDate: null, leaveStatus: null }, { where: { memberId: element.memberId } });

        if (success[0]) {
          console.log(`Transaction before ${date}/${month}/${new Date().getFullYear()}, ${hour}:${minute}:00 has been cancelled`);
        }
      });
    });
  } catch (error) {
    console.log(createDateAsUTC(new Date()), {
      Error: "Handle Transaction Epxired Error.",
    });
    console.log(error);
  }
}
// ======================   TRANSACTION (END)   ======================

// ======================  FORMULIR DEKLARASI KESEHATAN (START)  ======================
async function handleDeklarasiKesehatan() {
  try {
    schedule.scheduleJob("* * * * *", async function () {
      let date = new Date().getDate() < 10 ? `0${new Date().getDate()}` : new Date().getDate();
      let month = new Date().getMonth() + 1 < 10 ? `0${new Date().getMonth() + 1}` : new Date().getMonth() + 1;
      let hour = new Date().getHours();
      let minute = new Date().getMinutes();

      let member = await tblMember.findAll({
        where: { healthExpiredAt: { [Op.lte]: createDateAsUTC(new Date()) } },
      });

      if (member.length) {
        let promises = [];
        member.forEach(async (x) => {
          let data = {
            isHealthy: null,
            healthExpiredAt: null,
          };

          if (x.isFreeze) {
            data.isFreeze = null;
            data.freezeDate = null;
            data.unfreezeDate = createDateAsUTC(new Date());

            let revenueData;
            let cutiRevenue;

            if (x.isLeave) {
              revenueData = await tblRevenue.findAll({
                where: {
                  [Op.and]: [
                    {
                      memberId: x.memberId,
                    },
                    {
                      packageAfter: { [Op.not]: null },
                    },
                    {
                      packageAfter: { [Op.not]: "Cuti" },
                    },

                    {
                      status: "PENDING",
                    },
                  ],
                },
                order: [["activeMembershipExpired", "ASC"]],
              });

              cutiRevenue = await tblRevenue.findOne({
                where: {
                  [Op.and]: [
                    {
                      memberId: x.memberId,
                    },
                    {
                      packageAfter: "Cuti",
                    },
                    {
                      pending_saldo: { [Op.not]: null },
                    },
                    {
                      pending_saldo: { [Op.not]: 0 },
                    },
                  ],
                },
                order: [["activeMembershipExpired", "ASC"]],
              });

              data.leaveDate = createDateAsUTC(new Date(moment().subtract(cekSisaBeku(x.freezeDate, x.leaveDate), "days").format("YYYY-MM-DD")));
            } else {
              revenueData = await tblRevenue.findAll({
                where: {
                  [Op.and]: [
                    {
                      memberId: x.memberId,
                    },
                    {
                      packageAfter: { [Op.not]: null },
                    },
                    {
                      packageAfter: { [Op.not]: "Cuti" },
                    },
                    {
                      [Op.or]: [
                        {
                          [Op.and]: [
                            {
                              pending_saldo: { [Op.not]: null },
                            },
                            {
                              pending_saldo: { [Op.not]: 0 },
                            },
                          ],
                        },
                        {
                          status: "PENDING",
                        },
                      ],
                    },
                  ],
                },
                order: [["activeMembershipExpired", "ASC"]],
              });
            }

            data.activeExpired = createDateAsUTC(new Date(moment().add(cekSisaBeku(x.activeExpired, x.freezeDate), "days").format("YYYY-MM-DD")));

            let updateRevenueData;

            if (cutiRevenue) {
              let updateRevenueData = {
                pending_saldo: 0,
              };

              let newCutiRevenueData = {
                ...cutiRevenue.dataValues,
                dateActiveMembership: createDateAsUTC(new Date()),
                activeMembershipExpired: createDateAsUTC(new Date(moment().add(cutiRevenue.pending_saldo, "days").format("YYYY-MM-DD"))),
                debit: 0,
                kredit: 0,
                keterangan: cutiRevenue.keterangan.split(" ")[0] === "Terusan" ? cutiRevenue.keterangan : "Terusan" + " " + cutiRevenue.keterangan,
                status: "OPEN",
                dateActivePT: null,
                activePtExpired: null,
                packagePT: null,
                timesPT: null,
                PTTerpakai: null,
                isDone: null,
                pricePT: null,
              };

              delete newCutiRevenueData.id;
              promises.push(tblRevenue.create(newCutiRevenueData));
              promises.push(
                tblRevenue.update(updateRevenueData, {
                  where: { id: cutiRevenue.id },
                })
              );
            }

            if (revenueData.length) {
              await revenueData.forEach((y) => {
                if (y.status === "PENDING") {
                  updateRevenueData = {
                    dateActiveMembership: createDateAsUTC(new Date(moment(y.dateActiveMembership).add(cekSisaBeku(new Date(), x.freezeDate), "days"))),
                    activeMembershipExpired: createDateAsUTC(new Date(moment(y.activeMembershipExpired).add(cekSisaBeku(new Date(), x.freezeDate), "days"))),
                  };
                } else {
                  updateRevenueData = {
                    pending_saldo: 0,
                  };

                  let newRevenueData = {
                    ...y.dataValues,
                    dateActiveMembership: createDateAsUTC(new Date()),
                    activeMembershipExpired: createDateAsUTC(new Date(moment().add(y.pending_saldo, "days").format("YYYY-MM-DD"))),
                    debit: 0,
                    kredit: 0,
                    status: "OPEN",
                    keterangan: y.keterangan.split(" ")[0] === "Terusan" ? y.keterangan : "Terusan" + " " + y.keterangan,
                    saldo_member: y.saldo_member - y.kredit,
                    dateActivePT: null,
                    activePtExpired: null,
                    packagePT: null,
                    timesPT: null,
                    PTTerpakai: null,
                    isDone: null,
                    pricePT: null,
                  };

                  delete newRevenueData.id;
                  promises.push(tblRevenue.create(newRevenueData));
                }

                promises.push(tblRevenue.update(updateRevenueData, { where: { id: y.id } }));
              });
            }
          }

          promises.push(tblMember.update(data, { where: { memberId: x.memberId } }));
        });

        await Promise.all(promises);

        if (promises.length) {
          console.log(`Deklarasi Kesehatan before ${date}/${month}/${new Date().getFullYear()}, ${hour}:${minute}:00 has been reset.`);
        }
      }
    });
  } catch (error) {
    console.log(createDateAsUTC(new Date()), {
      Error: "Handle Reset Deklarasi Kesehatan Error.",
    });
    console.log(error);
  }
}
// ======================   FORMULIR DEKLARASI KESEHATAN (END)   ======================

//===================== PERPANJANG MEMBERSHIP APABILA MEMBER BELUM AKTIF ===============
async function handleMemberBelumAktif() {
  try {
    schedule.scheduleJob("* 1 * * *", async function () {
      let data = await tblMember.findAll({
        where: {
          [Op.and]: [{ activeDate: null }, { activeExpired: { [Op.not]: null } }],
        },
        include: { model: tblPackageMemberships, as: "packageMembership" },
      });

      await data.forEach(async (el) => {
        let memberActiveExpired = new Date(el.activeExpired);
        let updateActiveExpired = createDateAsUTC(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + el.packageMembership.times));
        let success = await tblMember.update(
          { activeExpired: updateActiveExpired },
          {
            where: { memberId: el.memberId },
          }
        );

        let revenue = await tblRevenue.findAll({
          where: {
            [Op.and]: [
              { memberId: el.memberId },
              { packageAfter: { [Op.not]: null } },
              {
                status: "PENDING",
              },
            ],
          },
          order: [["id", "ASC"]],
        });

        let promises = [];
        let activeMembershipExpiredBefore = null;
        revenue.forEach((x) => {
          let updateData = {
            dateActiveMembership:
              moment(x.dateActiveMembership).format("YYYY-MM-DD") <= moment().format("YYYY-MM-DD")
                ? createDateAsUTC(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()))
                : createDateAsUTC(new Date(new Date(activeMembershipExpiredBefore).getFullYear(), new Date(activeMembershipExpiredBefore).getMonth(), new Date(activeMembershipExpiredBefore).getDate())),
            activeMembershipExpired:
              moment(x.dateActiveMembership).format("YYYY-MM-DD") <= moment().format("YYYY-MM-DD")
                ? createDateAsUTC(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + x.times))
                : createDateAsUTC(new Date(new Date(activeMembershipExpiredBefore).getFullYear(), new Date(activeMembershipExpiredBefore).getMonth(), new Date(activeMembershipExpiredBefore).getDate() + x.times)),
          };

          activeMembershipExpiredBefore = updateData.activeMembershipExpired;
          promises.push(tblRevenue.update(updateData, { where: { id: x.id } }));
        });

        await Promise.all(promises);

        if (success[0]) {
          console.log(`Active Expired Member Not Active With Member ID ${el.memberId} Has Been Extended ${el.packageMembership.times} Day To ${updateActiveExpired}, Where Before ${memberActiveExpired}`);
        }
      });
    });
  } catch (error) {
    console.log(createDateAsUTC(new Date()), {
      Error: "Extend Membership Member Belum Aktif.",
    });
    console.log(error);
  }
}

async function handleKreditMember() {
  try {
    schedule.scheduleJob("* 23 * * *", async function () {
      let revenue = await tblRevenue.findAll({
        where: {
          [Op.and]: [
            {
              activeMembershipExpired: {
                [Op.gte]: createDateAsUTC(new Date()),
              },
            },
            {
              dateActiveMembership: {
                [Op.lte]: createDateAsUTC(new Date()),
              },
            },
            { packageAfter: { [Op.not]: null } },
            { status: { [Op.not]: "CLOSED" } },
          ],
        },
        include: [{ model: tblMember }],
      });

      let promises = [];

      await revenue.forEach((x) => {
        if (!x.tblMember.isFreeze && x.tblMember.activeDate && moment(new Date(x.last_kredited)).format("YYYY-MM-DD") <= moment().format("YYYY-MM-DD")) {
          let update = {
            kredit: Math.abs(cekSisaHari(x.dateActiveMembership)) + 1,
            last_kredited: createDateAsUTC(new Date()),
          };

          if ((update.kredit === x.debit && x.debit) || (update.kredit === x.pending_saldo && x.pending_saldo)) {
            update.status = "CLOSED";
            update.pending_saldo = 0;
          } else if (x.status === "PENDING") {
            if (x.packageAfter !== "1DP" || x.packageAfter !== "Cuti" || x.packageAfter !== "Beku") {
              promises.push(
                tblMember.update(
                  { packageMembershipId: x.packageAfter },
                  {
                    where: {
                      memberId: x.memberId,
                    },
                  }
                )
              );
            }
            update.status = "OPEN";
          }

          promises.push(tblRevenue.update(update, { where: { id: x.id } }));
        }
      });

      if (promises.length) {
        await Promise.all(promises);
        console.log("Revenue membership member telah dikreditkan.");
      }
    });
  } catch (error) {
    console.log(createDateAsUTC(new Date()), {
      Error: "Kredit Membership Gagal.",
    });
    console.log(error);
  }
}

//===================== PERPANJANG MEMBERSHIP APABILA MEMBER BELUM AKTIF (END) ===============

function getDate(args) {
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  return `${args.getDate()} ${months[args.getMonth()]} ${args.getFullYear()}`;
}

function cekSisaHari(args) {
  if (!args) return -30;

  let a = moment().format("YYYY-MM-DD");
  let b = moment(args, "YYYY-MM-DD");

  return b.diff(a, "days");
}

function cekSisaBeku(args, args2) {
  let a = moment(args2, "YYYY-MM-DD");
  let b = moment(args, "YYYY-MM-DD");

  return b.diff(a, "days");
}

module.exports = {
  rescheduleCRON,
  cancelReservation,
  rememberExtendPackage,
  rememberNonActiveMembership,
};
