const { tblRevenue, tblMember, tblHistoryPT, tblClassPt, tblTransaction, tblOrderList, tblPackageMemberships } = require("../models");
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
                { dateActiveMembership: { [Op.lte]: new Date(req.query.endDate) } },
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
                    { dateActivePT: { [Op.gte]: new Date(req.query.firstDate) } },
                  ],
                },
                { dateActivePT: { [Op.lte]: new Date(req.query.endDate) } },
              ],
            },
          ],
        },
        include: [{ model: tblMember }, { model: tblHistoryPT, include: [{ model: tblClassPt }] }],
      });

      let adminFeeData = await tblTransaction.findAll({
        where: {
          [Op.and]: [
            { admPrice: { [Op.not]: null } },
            { status: "paid" },
            { createdAt: { [Op.gte]: new Date(req.query.firstDate) } },
            {
              createdAt: {
                [Op.lte]: new Date(moment(new Date(req.query.endDate)).add(1, "days")),
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
                [Op.lte]: new Date(moment(new Date(req.query.endDate)).add(1, "days")),
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
        let parameter1 = el.dateActiveMembership <= req.query.firstDate ? moment(new Date(req.query.firstDate)).format("YYYY-MM-DD") : moment(new Date(el.dateActiveMembership)).format("YYYY-MM-DD");
        let parameter2 = el.activeMembershipExpired <= req.query.endDate ? moment(new Date(el.activeMembershipExpired)).format("YYYY-MM-DD") : moment(new Date(req.query.endDate)).add(1, "days").format("YYYY-MM-DD");

        if (el.packageAfter && el.packageAfter !== "Cuti") {
          let dataMembership = {
            dateActiveMembership: moment(new Date(el.dateActiveMembership)).format("YYYY-MM-DD"),
            memberId: el.memberId,
            packageBefore: el.packageBefore,
            packageAfter: el.packageAfter,
            price: el.price,
            times: el.times,
            berjalan: cekDurasiBerjalan(parameter1, parameter2),
          };

          if (dataMembership.berjalan > 0) {
            dataMembership.revenue = lodash.round((dataMembership.price / dataMembership.times) * dataMembership.berjalan);
            totalRevenueMembership += dataMembership.revenue;
            detailMembership.push(dataMembership);
          }
        }

        if (el.packagePT) {
          let dataPT = {
            dateActivePT: !el.dateActivePT ? "-" : moment(new Date(el.dateActivePT)).format("YYYY-MM-DD"),
            penggunaanPT: await el.tblHistoryPTs.filter(
              (x) =>
                moment(`${x.tblClassPt.year}-${x.tblClassPt.month}-${x.tblClassPt.date}`, "YYYY-MM-DD") >= moment(req.query.firstDate, "YYYY-MM-DD") &&
                moment(`${x.tblClassPt.year}-${x.tblClassPt.month}-${x.tblClassPt.date}`, "YYYY-MM-DD") <= moment(req.query.endDate, "YYYY-MM-DD")
            ).length,
            memberId: el.memberId,
            packagePT: el.packagePT,
            pricePT: el.pricePT,
            timesPT: el.timesPT,
          };

          if (dataPT.penggunaanPT > 0) {
            dataPT.revenuePT = lodash.round((dataPT.pricePT / dataPT.timesPT) * dataPT.penggunaanPT);
            totalRevenuePT += dataPT.revenuePT;
            detailPT.push(dataPT);
          }
        }

        if (el.packageBefore === "Cuti" && el.packageAfter === "Cuti" && new Date(el.dateActiveMembership) >= new Date(req.query.firstDate) && el.keterangan !== "Terusan Cuti Membership") {
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
          if (x.packageBefore === y.packageBefore && x.packageAfter === y.packageAfter && idx !== index) {
            tmpData.revenue += y.revenue;
          }
        });
        dataRevenueMembership.push(tmpData);
      });

      dataRevenuePT = Array.from(
        detailPT.reduce((m, { packagePT, revenuePT }) => m.set(packagePT, (m.get(packagePT) || 0) + revenuePT), new Map()),
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
          if (x.leavePackage === y.leavePackage && x.leavePrice === y.leavePrice && idx !== index) {
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
          if (x.tblPackageMembership.package === y.tblPackageMembership.package && idx !== index) {
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
        x.dateActiveMembership = createDateAsUTC(new Date(moment(new Date(x.dateActiveMembership)).add(1, "days").format("YYYY-MM-DD")));
        x.activeMembershipExpired = createDateAsUTC(new Date(moment(new Date(x.activeMembershipExpired)).add(1, "days").format("YYYY-MM-DD")));

        if (x.last_kredited) x.last_kredited = createDateAsUTC(new Date(moment(new Date(x.last_kredited)).add(1, "days").format("YYYY-MM-DD")));
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
        x.dateActivePT = x.dateActivePT ? createDateAsUTC(new Date(moment(new Date(x.dateActivePT)).add(1, "days").format("YYYY-MM-DD"))) : null;
        x.activePtExpired = x.activePtExpired ? createDateAsUTC(new Date(moment(new Date(x.activePtExpired)).add(1, "days").format("YYYY-MM-DD"))) : null;
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
              activeExpired: createDateAsUTC(new Date(moment(member.activeExpired).add(2, "days"))),
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
        promises.push(tblHistoryPT.update({ revenueId: x.revenueId }, { where: { id: x.id } }));
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
        promises.push(tblRevenue.update({ packageBefore: x.packageBefore, packageAfter: x.packageAfter }, { where: { id: x.id } }));
      });

      await Promise.all(promises);

      res.status(200).json({ message: "Success", data });
    } catch (error) {
      next(error);
    }
  }
}

const cekDurasiBerjalan = (args, end) => {
  let date = new Date(end) >= new Date() ? new Date(moment().add(1, "days").format("YYYY-MM-DD")) : new Date(end);

  let a = moment(date, "YYYY-MM-DD");
  let b = moment(new Date(args), "YYYY-MM-DD");

  return a.diff(b, "days");
};

module.exports = RevenueController;
