const {
  tblRevenue,
  tblMember,
  tblHistoryPT,
  tblClassPt,
  tblTransaction,
  tblOrderList,
  tblPackageMemberships,
  tblUser,
  sequelize,
} = require("../models");
const Op = require("sequelize").Op;
const { createDateAsUTC } = require("../helpers/convertDate");
const moment = require("moment");
const lodash = require("lodash");
const excelToJson = require("convert-excel-to-json");

class RevenueController {
  static async findAll(req, res, next) {
    try {
      let data = await tblRevenue.findAll({
        where: {
          [Op.or]: [
            {
              [Op.and]: [
                {
                  [Op.or]: [
                    {
                      activeMembershipExpired: {
                        [Op.gte]: new Date(req.query.firstDate),
                      },
                    },
                    {
                      dateActiveMembership: {
                        [Op.gte]: new Date(req.query.firstDate),
                      },
                    },
                  ],
                },
                {
                  dateActiveMembership: {
                    [Op.lte]: new Date(req.query.endDate),
                  },
                },
                { is_event: { [Op.not]: 1 } },
                { status: { [Op.not]: "PENDING" } },
              ],
            },
            {
              [Op.and]: [
                {
                  [Op.or]: [
                    {
                      activePtExpired: {
                        [Op.gte]: new Date(req.query.firstDate),
                      },
                    },
                    { activePtExpired: null },
                    {
                      dateActivePT: { [Op.gte]: new Date(req.query.firstDate) },
                    },
                  ],
                },
                { dateActivePT: { [Op.lte]: new Date(req.query.endDate) } },
              ],
            },
          ],
        },
        include: [
          { model: tblMember },
          { model: tblHistoryPT, include: [{ model: tblClassPt }] },
        ],
        attributes: { exclude: ["createdAt", "updatedAt"] },
      });

      let adminFeeData = await tblTransaction.findAll({
        where: {
          [Op.and]: [
            { admPrice: { [Op.not]: null } },
            { status: "paid" },
            { createdAt: { [Op.gte]: new Date(req.query.firstDate) } },
            {
              createdAt: {
                [Op.lte]: new Date(
                  moment(new Date(req.query.endDate)).add(1, "days")
                ),
              },
            },
          ],
        },
      });

      let productData = await tblOrderList.findAll({
        where: {
          [Op.and]: [
            { categoryMembershipId: 7 },
            { salesInvoice: { [Op.not]: null } },
            { createdAt: { [Op.gte]: new Date(req.query.firstDate) } },
            {
              createdAt: {
                [Op.lte]: new Date(
                  moment(new Date(req.query.endDate)).add(1, "days")
                ),
              },
            },
          ],
        },
        raw: true,
        nest: true,
        include: [{ model: tblPackageMemberships }],
      });

      let totalRevenueMembership = 0;
      let dataRevenueMembership = [];
      let detailMembership = [];

      let totalRevenuePT = 0;
      let dataRevenuePT = [];
      let detailPT = [];

      let totalRevenueCUTI = 0;
      let dataRevenueCUTI = [];
      let detailCuti = [];

      let totalRevenueAdminFee = 0;
      let detailAdminFeeData = [];

      let totalRevenueProduct = 0;
      let detailProductData = [];

      await data.forEach(async (el) => {
        let parameter1 =
          el.dateActiveMembership <= req.query.firstDate
            ? moment(new Date(req.query.firstDate)).format("YYYY-MM-DD")
            : moment(new Date(el.dateActiveMembership)).format("YYYY-MM-DD");
        let parameter2 =
          el.activeMembershipExpired <= req.query.endDate
            ? moment(new Date(el.activeMembershipExpired)).format("YYYY-MM-DD")
            : moment(new Date(req.query.endDate))
                .add(1, "days")
                .format("YYYY-MM-DD");

        if (el.packageAfter && el.packageAfter !== "Cuti") {
          let dataMembership = {
            dateActiveMembership: moment(
              new Date(el.dateActiveMembership)
            ).format("YYYY-MM-DD"),
            memberId: el.memberId,
            packageBefore: el.packageBefore,
            packageAfter: el.packageAfter,
            price: el.price,
            times: el.times,
            berjalan: cekDurasiBerjalan(parameter1, parameter2),
          };

          if (dataMembership.berjalan > 0) {
            dataMembership.revenue = lodash.round(
              (dataMembership.price / dataMembership.times) *
                dataMembership.berjalan
            );
            totalRevenueMembership += dataMembership.revenue;
            detailMembership.push(dataMembership);
          }
        }

        if (el.packagePT) {
          let dataPT = {
            dateActivePT: !el.dateActivePT
              ? "-"
              : moment(new Date(el.dateActivePT)).format("YYYY-MM-DD"),
            penggunaanPT: await el.tblHistoryPTs.filter(
              (x) =>
                moment(
                  `${x.tblClassPt.year}-${x.tblClassPt.month}-${x.tblClassPt.date}`,
                  "YYYY-MM-DD"
                ) >= moment(req.query.firstDate, "YYYY-MM-DD") &&
                moment(
                  `${x.tblClassPt.year}-${x.tblClassPt.month}-${x.tblClassPt.date}`,
                  "YYYY-MM-DD"
                ) <= moment(req.query.endDate, "YYYY-MM-DD")
            ).length,
            memberId: el.memberId,
            packagePT: el.packagePT,
            pricePT: el.pricePT,
            timesPT: el.timesPT,
          };

          if (dataPT.penggunaanPT > 0) {
            dataPT.revenuePT = lodash.round(
              (dataPT.pricePT / dataPT.timesPT) * dataPT.penggunaanPT
            );
            totalRevenuePT += dataPT.revenuePT;
            detailPT.push(dataPT);
          }
        }

        if (
          el.packageBefore === "Cuti" &&
          el.packageAfter === "Cuti" &&
          new Date(el.dateActiveMembership) >= new Date(req.query.firstDate) &&
          el.keterangan !== "Terusan Cuti Membership"
        ) {
          let dataCuti = {
            leavePackage: "Cuti",
            leavePrice: el.price,
          };

          totalRevenueCUTI += el.price;
          detailCuti.push(dataCuti);
        }
      });

      detailMembership.forEach((x, idx) => {
        let tmpData = {
          packageBefore: x.packageBefore,
          packageAfter: x.packageAfter,
          revenue: x.revenue,
        };
        detailMembership.forEach((y, index) => {
          if (
            x.packageBefore === y.packageBefore &&
            x.packageAfter === y.packageAfter &&
            idx !== index
          ) {
            tmpData.revenue += y.revenue;
          }
        });
        dataRevenueMembership.push(tmpData);
      });

      dataRevenuePT = Array.from(
        detailPT.reduce(
          (m, { packagePT, revenuePT }) =>
            m.set(packagePT, (m.get(packagePT) || 0) + revenuePT),
          new Map()
        ),
        ([packagePT, revenuePT]) => ({ packagePT, revenuePT })
      );

      detailCuti.forEach((x, idx) => {
        let tmpData = {
          leavePackage: x.leavePackage,
          leavePrice: x.leavePrice,
          qty: 1,
          revenueCuti: x.leavePrice,
        };
        detailCuti.forEach((y, index) => {
          if (
            x.leavePackage === y.leavePackage &&
            x.leavePrice === y.leavePrice &&
            idx !== index
          ) {
            tmpData.qty++;
            tmpData.revenueCuti += y.leavePrice;
          }
        });
        dataRevenueCUTI.push(tmpData);
      });

      adminFeeData.forEach((x, idx) => {
        totalRevenueAdminFee += x.admPrice;
        let tmpData = {
          name: "Admin Fee",
          price: x.admPrice,
          qty: 1,
          revenueAdminFee: x.admPrice,
        };
        adminFeeData.forEach((y, index) => {
          if (x.admPrice === y.admPrice && idx !== index) {
            tmpData.qty++;
            tmpData.revenueAdminFee += y.admPrice;
          }
        });
        detailAdminFeeData.push(tmpData);
      });

      productData.forEach((x, idx) => {
        totalRevenueProduct += x.totalPrice;
        let tmpData = {
          name: x.tblPackageMembership.package,
          price: x.totalPrice,
          qty: 1,
          revenueProduct: x.totalPrice,
        };
        productData.forEach((y, index) => {
          if (
            x.tblPackageMembership.package === y.tblPackageMembership.package &&
            idx !== index
          ) {
            tmpData.qty++;
            tmpData.revenueProduct += y.totalPrice;
          }
        });
        detailProductData.push(tmpData);
      });

      res.status(200).json({
        membership: lodash.uniqWith(dataRevenueMembership, lodash.isEqual),
        detailMembership,
        pt: dataRevenuePT,
        detailPT,
        cuti: lodash.uniqWith(dataRevenueCUTI, lodash.isEqual),
        adminFee: lodash.uniqWith(detailAdminFeeData, lodash.isEqual),
        product: lodash.uniqWith(detailProductData, lodash.isEqual),
        totalRevenueMembership,
        totalRevenuePT,
        totalRevenueCUTI,
        totalRevenueAdminFee,
        totalRevenueProduct,
      });
    } catch (error) {
      next(error);
    }
  }

  static async importExcel(req, res, next) {
    try {
      const data = excelToJson({
        sourceFile: `./${req.file.path}`,
        sheets: [
          {
            name: "tblRevenues",
            header: {
              rows: 1,
            },
            columnToKey: {
              A: "memberId",
              B: "dateActiveMembership",
              C: "activeMembershipExpired",
              D: "keterangan",
              E: "status",
              F: "packageBefore",
              G: "packageAfter",
              H: "times",
              I: "debit",
              J: "kredit",
              K: "saldo_member",
              L: "pending_saldo",
              M: "price",
              N: "is_event",
              O: "last_kredited",
            },
          },
        ],
      });

      await data.tblRevenues.forEach((x) => {
        x.dateActiveMembership = createDateAsUTC(
          new Date(
            moment(new Date(x.dateActiveMembership))
              .add(1, "days")
              .format("YYYY-MM-DD")
          )
        );
        x.activeMembershipExpired = createDateAsUTC(
          new Date(
            moment(new Date(x.activeMembershipExpired))
              .add(1, "days")
              .format("YYYY-MM-DD")
          )
        );

        if (x.last_kredited)
          x.last_kredited = createDateAsUTC(
            new Date(
              moment(new Date(x.last_kredited))
                .add(1, "days")
                .format("YYYY-MM-DD")
            )
          );
      });

      await tblRevenue.bulkCreate(data.tblRevenues);
      res.status(200).json({ message: "Success", data });
    } catch (error) {
      next(error);
    }
  }

  static async importPt(req, res, next) {
    try {
      const data = excelToJson({
        sourceFile: `./${req.file.path}`,
        sheets: [
          {
            name: "tblRevenues",
            header: {
              rows: 1,
            },
            columnToKey: {
              A: "memberId",
              P: "activePtExpired",
              Q: "dateActivePT",
              R: "packagePT",
              S: "timesPT",
              T: "pricePT",
              U: "PTTerpakai",
              V: "isDone",
            },
          },
        ],
      });

      await data.tblRevenues.forEach((x) => {
        x.dateActivePT = x.dateActivePT
          ? createDateAsUTC(
              new Date(
                moment(new Date(x.dateActivePT))
                  .add(1, "days")
                  .format("YYYY-MM-DD")
              )
            )
          : null;
        x.activePtExpired = x.activePtExpired
          ? createDateAsUTC(
              new Date(
                moment(new Date(x.activePtExpired))
                  .add(1, "days")
                  .format("YYYY-MM-DD")
              )
            )
          : null;
      });

      await tblRevenue.bulkCreate(data.tblRevenues);
      res.status(200).json({ message: "Success", data });
    } catch (error) {
      next(error);
    }
  }

  static async promoNovember(req, res, next) {
    try {
      const data = excelToJson({
        sourceFile: `./${req.file.path}`,
        sheets: [
          {
            name: "member",
            header: {
              rows: 1,
            },
            columnToKey: {
              A: "memberId",
            },
          },
        ],
      });

      let promises = [];

      data.member.forEach(async (x) => {
        let member = await tblMember.findByPk(x.memberId);
        promises.push(
          tblMember.update(
            {
              activeExpired: createDateAsUTC(
                new Date(moment(member.activeExpired).add(2, "days"))
              ),
            },
            { where: { memberId: x.memberId } }
          )
        );
      });

      await Promise.all(promises);

      res.status(200).json({ message: "Success", data });
    } catch (error) {
      next(error);
    }
  }

  static async updateHistoryPT(req, res, next) {
    try {
      const data = excelToJson({
        sourceFile: `./${req.file.path}`,
        sheets: [
          {
            name: "tblHistoryPTs",
            header: {
              rows: 1,
            },
            columnToKey: {
              A: "id",
              B: "revenueId",
            },
          },
        ],
      });

      let promises = [];

      data.tblHistoryPTs.forEach(async (x) => {
        promises.push(
          tblHistoryPT.update(
            { revenueId: x.revenueId },
            { where: { id: x.id } }
          )
        );
      });

      await Promise.all(promises);

      res.status(200).json({ message: "Success", data });
    } catch (error) {
      next(error);
    }
  }

  static async updateRevenue(req, res, next) {
    try {
      const data = excelToJson({
        sourceFile: `./${req.file.path}`,
        sheets: [
          {
            name: "tblRevenues",
            header: {
              rows: 1,
            },
            columnToKey: {
              A: "id",
              B: "packageBefore",
              C: "packageAfter",
            },
          },
        ],
      });

      let promises = [];

      data.tblRevenues.forEach(async (x) => {
        promises.push(
          tblRevenue.update(
            { packageBefore: x.packageBefore, packageAfter: x.packageAfter },
            { where: { id: x.id } }
          )
        );
      });

      await Promise.all(promises);

      res.status(200).json({ message: "Success", data });
    } catch (error) {
      next(error);
    }
  }

  static async transferRevenue(req, res, next) {
    const trans = await sequelize.transaction();
    try {
      const { member_1, member_2 } = req.query;
      if (req.user.roleId !== 1) throw { name: "unauthorized" };
      const dataMember1 = await tblMember.findByPk(member_1, {
        include: [
          {
            model: tblUser,
          },
          {
            model: tblRevenue,
          },
        ],
      });
      const dataMember2 = await tblMember.findByPk(member_2, {
        include: [
          {
            model: tblUser,
          },
          {
            model: tblRevenue,
          },
        ],
      });

      //! cek available member
      if (!dataMember1 || !dataMember2) throw { name: "notFound" };

      //! cek data member1 paket expired
      if (
        createDateAsUTC(new Date(dataMember1.activeExpired)) <=
        createDateAsUTC(new Date())
      )
        throw { name: "memberExp" };

      //! cek method transfer
      if (!req.body.transfer)
        return res
          .status(403)
          .json({ success: false, message: "please check transfer !" });

      //! cek if members cuti
      if (dataMember1.isLeave || dataMember2.isLeave)
        return res.status(403).json({
          success: false,
          message: "Can't transfer with status member is cuti !",
        });

      let revenues = [];

      let data = {};
      //todo: execution data with transfer method
      if (req.body.transfer === "PT") {
        if (!dataMember1.ptSession) throw { name: "sessionDone" };

        revenues = dataMember1.tblRevenues
          .sort((a, b) => a.id - b.id)
          .filter((el) => !el.isDone && el.packagePT);

        if (!revenues.length) throw { name: "sessionDone" };

        //* create some revenue on member_2 as length of member_1 revenues
        let newRevenueMember2 = [];
        revenues.forEach((el) => {
          newRevenueMember2.push({
            memberId: member_2,
            keterangan: `Terusan MPSI-0000${member_1}`,
            packagePT: el.packagePT,
            timesPT: el.timesPT,
            PTTerpakai: el.PTTerpakai ?? null,
            pricePT: el.pricePT,
          });
        });
        await tblRevenue.bulkCreate(newRevenueMember2, {
          transaction: trans,
        });

        //* update revenue on member_1 as length of member_1 revenues PT Undone
        let updateRevenueMember1 = [];
        revenues.forEach(async (x) => {
          updateRevenueMember1.push(
            tblRevenue.update(
              {
                dateActivePT: x.dateActivePT ?? createDateAsUTC(new Date()),
                activePtExpired:
                  x.activePtExpired ?? createDateAsUTC(new Date()),
                PTTerpakai: x.PTTerpakai ?? 0,
                isDone: true,
              },
              { where: { id: x.id } },
              { transaction: trans }
            )
          );
        });
        await Promise.all(updateRevenueMember1);

        //* update every member data after transfer
        await tblMember.update(
          { ptSession: dataMember2.ptSession + dataMember1.ptSession },
          { where: { memberId: member_2 } },
          { transaction: trans }
        );
        await tblMember.update(
          { ptSession: 0 },
          { where: { memberId: member_1 } },
          { transaction: trans }
        );

        data.message = `Transfer PT member ${member_1} to ${member_2}`;
        data.transferMethod = "PT";
        data.totalTransfer = dataMember1.ptSession;
      } else if (req.body.transfer === "Membership") {
        revenues = dataMember1.tblRevenues
          .filter((el) => el.activeMembershipExpired)
          .sort((a, b) => b.id - a.id);

        if (!revenues.length) throw { name: "memberExp" };

        const filterMember2Rev = dataMember2.tblRevenues
          .filter((el) => el.activeMembershipExpired)
          .sort((a, b) => b.id - a.id);

        //* create the revenue on member_2 references from member_1 revenue
        let newRevenueMember2 = {
          memberId: member_2,
          dateActiveMembership:
            filterMember2Rev[0].status === "CLOSED"
              ? createDateAsUTC(new Date())
              : createDateAsUTC(
                  new Date(filterMember2Rev[0].activeMembershipExpired)
                ),
          activeMembershipExpired:
            filterMember2Rev[0].status === "CLOSED"
              ? moment()
                  .add(cekSisaHari(dataMember1.activeExpired), "days")
                  .format("YYYY-MM-DD")
              : moment(filterMember2Rev[0].activeMembershipExpired)
                  .add(cekSisaHari(dataMember1.activeExpired), "days")
                  .format("YYYY-MM-DD"),
          keterangan: `Terusan MPSI-0000${member_1}`,
          status: filterMember2Rev[0].status === "CLOSED" ? "OPEN" : "PENDING",
          packageBefore: filterMember2Rev[0].packageAfter,
          packageAfter: revenues[0].packageAfter,
          times: revenues[0].times,
          debit: revenues[0].debit,
          kredit: revenues[0].kredit,
          saldo_member:
            filterMember2Rev[0].status === "CLOSED"
              ? cekSisaHari(
                  moment()
                    .add(cekSisaHari(dataMember1.activeExpired), "days")
                    .format("YYYY-MM-DD")
                )
              : cekSisaHari(
                  moment(filterMember2Rev[0].activeMembershipExpired)
                    .add(cekSisaHari(dataMember1.activeExpired), "days")
                    .format("YYYY-MM-DD")
                ),
          price: revenues[0].price,
          is_event: false,
        };

        await tblRevenue.create(newRevenueMember2, {
          transaction: trans,
        });

        //* update the revenue on member_1 after transfer to member_2 revenue
        await tblRevenue.update(
          {
            activeMembershipExpired: createDateAsUTC(new Date()),
            status: "CLOSED",
          },
          {
            where: { id: revenues[0].id },
          },
          { transaction: trans }
        );

        //* update every member data after transfer
        await tblMember.update(
          {
            activeExpired:
              createDateAsUTC(new Date(dataMember2.activeExpired)) <=
              createDateAsUTC(new Date())
                ? moment()
                    .add(cekSisaHari(dataMember1.activeExpired), "days")
                    .format("YYYY-MM-DD")
                : moment(dataMember2.activeExpired)
                    .add(cekSisaHari(dataMember1.activeExpired), "days")
                    .format("YYYY-MM-DD"),
          },
          { where: { memberId: member_2 } },
          { transaction: trans }
        );
        await tblMember.update(
          {
            activeExpired: moment().subtract(2, "weeks").format("YYYY-MM-DD"),
          },
          { where: { memberId: member_1 } },
          { transaction: trans }
        );
        data.message = `Transfer packet membership ${member_1} to ${member_2}`;
        data.transferMethod = "Membership";
        data.totalTransfer = `${cekSisaHari(dataMember1.activeExpired)} days`;
      } else if (req.body.transfer === "Both") {
        await tblMember.update(
          {
            activeExpired:
              createDateAsUTC(new Date(dataMember2.activeExpired)) <=
              createDateAsUTC(new Date())
                ? moment()
                    .add(cekSisaHari(dataMember1.activeExpired), "days")
                    .format("YYYY-MM-DD")
                : moment(dataMember2.activeExpired)
                    .add(cekSisaHari(dataMember1.activeExpired), "days")
                    .format("YYYY-MM-DD"),
            ptSession: dataMember2.ptSession + dataMember1.ptSession,
          },
          { where: { memberId: member_2 } },
          { transaction: trans }
        );
        await tblMember.update(
          {
            activeExpired: moment().subtract(2, "weeks").format("YYYY-MM-DD"),
            ptSession: 0,
          },
          { where: { memberId: member_1 } },
          { transaction: trans }
        );

        data.message = `Transfer PT & Membership ${member_1} to ${member_2}`;
        data.transferMethod = "Both";
        data.totalTransfer = `PT ${
          dataMember1.ptSession
        } Sesi & Membership ${cekSisaHari(dataMember1.activeExpired)} days`;
      } else
        return res
          .status(403)
          .json({ success: false, message: "please check transfer !" });

      await trans.commit();
      res.status(200).json({ success: true, data: data });
    } catch (error) {
      await trans.rollback();
      next(error);
    }
  }
}

const cekDurasiBerjalan = (args, end) => {
  let date =
    new Date(end) >= new Date()
      ? new Date(moment().add(1, "days").format("YYYY-MM-DD"))
      : new Date(end);

  let a = moment(date, "YYYY-MM-DD");
  let b = moment(new Date(args), "YYYY-MM-DD");

  return a.diff(b, "days");
};

function cekSisaHari(args) {
  if (!args) return -30;

  let a = moment().format("YYYY-MM-DD");
  let b = moment(args, "YYYY-MM-DD");

  return b.diff(a, "days");
}

module.exports = RevenueController;
