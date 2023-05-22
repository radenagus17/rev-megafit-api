const {
  tblPromo,
  tblRevenue,
  tblPackageMemberships,
  tblMember,
  tblTransaction,
  tblOrderList,
  tblHistoryPromo,
  tblUser,
  tblPromoProduct,
  sequelize,
} = require("../models");
const moment = require("moment");
const Op = require("sequelize").Op;
const { QueryTypes } = require("sequelize");
const { createDateAsUTC } = require("../helpers/convertDate");

class promo {
  static async create(req, res, next) {
    const t = await sequelize.transaction();
    try {
      if (req.body.code) {
        let checkCode = await tblPromo.findOne({
          where: { code: req.body.code },
        });

        if (checkCode)
          return res.status(409).json({
            success: false,
            message: "conflict code voucher",
            code: req.body.code,
          });
      }
      let data = {
        name: req.body.name,
        code: req.body.code,
        poster: req.file ? req.file.path : null,
        periodeStart: req.body.periodeStart,
        periodeEnd: req.body.periodeEnd,
        typeVoucher: req.body.typeVoucher,
        discountMax: req.body.discountMax,
        minimumPurchase: req.body.minimumPurchase,
        usageQuota: req.body.usageQuota,
        forAll: req.body.forAll,
        nominal: req.body.nominal,
        keterangan: req.body.keterangan,
        canCombine: req.body.canCombine,
        isUnlimited: req.body.isUnlimited,
      };

      const newPromo = await tblPromo.create(data, { transaction: t });

      if (!req.body.forAll || req.body.forAll === "false") {
        let newListProduct;
        if (typeof req.body.product === "object") {
          newListProduct = req.body.product;
        } else {
          newListProduct = JSON.parse(req.body.product);
        }

        if (newListProduct.length > 3)
          return res.status(403).json({
            success: false,
            message: "You can't add product more than 3",
          });

        if (Array.isArray(newListProduct)) {
          newListProduct.forEach(async (element) => {
            await tblPromoProduct.create(
              {
                promoId: newPromo.id,
                productId: element.id,
              },
              { transaction: t }
            );
          });
        }
      }

      const getOne = await tblPromo.findOne(
        {
          include: { model: tblPromoProduct, include: tblPackageMemberships },
        },
        { transaction: t }
      );

      await t.commit();

      res.status(201).json({ message: "Success", getOne });
    } catch (error) {
      await t.rollback();
      next(error);
    }
  }

  static async edit(req, res, next) {
    const t = await sequelize.transaction();
    try {
      if (req.body.code) {
        const beforeEdit = await tblPromo.findOne({
          where: {
            code: req.body.code,
            id: { [Op.not]: req.params.id },
          },
        });

        if (beforeEdit)
          return res.status(409).json({
            success: false,
            message: "duplicate voucher code !",
            code: req.body.code,
          });
      }

      let data = {
        name: req.body.name,
        code: req.body.code,
        periodeStart: req.body.periodeStart,
        periodeEnd: req.body.periodeEnd,
        typeVoucher: req.body.typeVoucher,
        discountMax: req.body.discountMax,
        minimumPurchase: req.body.minimumPurchase,
        usageQuota: req.body.usageQuota,
        forAll: req.body.forAll,
        nominal: req.body.nominal,
        keterangan: req.body.keterangan,
        canCombine: req.body.canCombine,
        isUnlimited: req.body.isUnlimited,
        // product: req.body.product,
      };

      if (req.file) data.poster = req.file.path;

      await tblPromo.update(
        data,
        { where: { id: req.params.id } },
        { transaction: t }
      );

      if (!req.body.forAll || req.body.forAll === "false") {
        let newListProduct;
        if (typeof req.body.product === "object") {
          newListProduct = req.body.product;
        } else {
          newListProduct = JSON.parse(req.body.product);
        }
        if (Array.isArray(newListProduct)) {
          if (newListProduct.length > 3)
            return res.status(403).json({
              success: false,
              message: "You can't add product more than 3",
            });
          let allVoucherProduk = await tblPromoProduct.findAll(
            {
              where: { promoId: req.params.id },
            },
            { transaction: t }
          );

          allVoucherProduk.forEach(async (el) => {
            let isAvailable = newListProduct.find(
              (product) => product.id === el.productId
            );

            if (!isAvailable)
              await tblPromoProduct.destroy(
                { where: { id: isAvailable.id } },
                { transaction: t }
              );
          });

          newListProduct.forEach(async (el) => {
            let isAvailable = allVoucherProduk.find(
              (product) => product.productId === el.id
            );

            if (!isAvailable)
              await tblPromoProduct.create(
                {
                  promoId: req.params.id,
                  productId: el.id,
                },
                { transaction: t }
              );
          });
        }
      } else {
        await tblPromoProduct.destroy(
          { where: { promoId: req.params.id } },
          { transaction: t }
        );
      }

      const getOne = await tblPromo.findOne(
        {
          include: { model: tblPromoProduct, include: tblPackageMemberships },
        },
        { transaction: t }
      );

      await t.commit();

      res.status(200).json({ message: "Success", getOne });
    } catch (error) {
      await t.rollback();
      next(error);
    }
  }

  static async findAll(req, res, next) {
    try {
      let data = await tblPromo.findAll({
        order: [["periodeEnd", "ASC"]],
        include: { model: tblPromoProduct },
      });
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  static async findOne(req, res, next) {
    try {
      let data = await tblPromo.findOne({
        where: {
          id: req.params.id,
        },
        include: { model: tblPromoProduct },
      });
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      let deleted = await tblPromo.destroy({
        where: { id: req.params.id },
      });
      if (!deleted) throw { name: "notFound" };
      await tblPromoProduct.destroy({ where: { promoId: req.params.id } });
      res.status(200).json({ message: "Success", deleted: req.params.id });
    } catch (error) {
      next(error);
    }
  }

  //todo: for Member
  static async takeVoucher(req, res, next) {
    try {
      if (req.user.roleId !== 2) throw { name: "unauthorized" };
      if (!req.body.code || !req.body || req.body.code === undefined)
        throw { name: "notFound" };

      const data = await tblPromo.findOne({
        where: {
          code: req.body.code,
        },
        include: { model: tblPromoProduct },
      });

      if (!data) throw { name: "notFound" };
      if (cekSisaHari(data.periodeEnd) <= 0) throw { name: "notFound" };

      const dataUser = await tblMember.findOne({
        where: { userId: req.user.userId },
      });

      //! check the data whether the member has ever taken a promo
      const dataHistoryPromo = await tblHistoryPromo.findAll({
        where: {
          memberId: dataUser.memberId,
        },
        include: { model: tblPromo },
        order: [["id", "DESC"]],
      });

      if (
        (cekSisaHari(dataHistoryPromo[0]?.claimDate) === 0 &&
          !dataHistoryPromo[0]?.tblPromo.canCombine) ||
        (cekSisaHari(dataHistoryPromo[0]?.claimDate) === 0 && !data.canCombine)
      )
        return res.status(401).json({
          success: false,
          message:
            "The voucher code you are using cannot be combined with other voucher codes. Please double-check and use only one valid voucher code. Thank you.",
        });

      if (data?.usageQuota - 1 < 0 && !data.isUnlimited)
        return res
          .status(403)
          .json({ success: false, message: "Quota runs out !" });

      const findDuplicateData = dataHistoryPromo.find(
        (el) =>
          el.idVoucher == data.id &&
          moment(el.claimDate).format("YYYY-MM-DD") ==
            moment().format("YYYY-MM-DD")
      );

      if (findDuplicateData)
        return res.status(403).json({
          success: false,
          message: "You cannot claim the promo two times in 1 period",
        });

      // const revenueData = await tblRevenue.findAll({
      //   where: { memberId: dataUser.memberId },
      //   order: [["id", "DESC"]],
      // });

      if (req.query.transaction) {
        const transaction = await tblTransaction.findAll({
          where: { memberId: dataUser.memberId, status: "unpaid" },
          include: { model: tblOrderList },
          order: [["createdAt", "DESC"]],
        });
        if (!transaction.length) throw { name: "notFound" };
        let lastTransaction = transaction[0];

        if (
          data.minimumPurchase &&
          lastTransaction.amount < data.minimumPurchase
        )
          return res.status(409).json({
            success: false,
            message: "Transaction Order is less than minimum promo !",
          });

        let cart = lastTransaction.tblOrderLists;
        let totalPotongan = 0;

        if (data.forAll) {
          //todo: this is for all product
          let promise = [];
          cart.forEach((el) => {
            promise.push(
              tblOrderList.update(
                {
                  promoId: data.id,
                },
                { where: { id: el.id } }
              )
            );

            totalPotongan +=
              data.typeVoucher == "diskon"
                ? percentage(el.totalPrice, data.nominal)
                : data.nominal;
          });
          await Promise.all(promise);
        } else {
          //todo: this is for some product
          const pairProduct = cart.filter((el) => {
            return data.tblPromoProducts.some((product) => {
              return el.packageMembershipId == product.productId;
            });
          });

          if (!pairProduct.length) throw { name: "notFound" };
          let updateOrder = [];
          pairProduct.forEach((el) => {
            updateOrder.push(
              tblOrderList.update(
                {
                  promoId: data.id,
                },
                { where: { id: el.id } }
              )
            );

            totalPotongan +=
              data.typeVoucher == "diskon"
                ? percentage(el.totalPrice, data.nominal)
                : data.nominal;
          });
          await Promise.all(updateOrder);
        }
        await tblHistoryPromo.create({
          memberId: dataUser.memberId,
          idVoucher: data.id,
          claimDate: createDateAsUTC(new Date()),
          keterangan: data.keterangan || data.name,
          discount: totalPotongan,
          transaction: lastTransaction.transactionId,
        });

        if (!data.isUnlimited && data.usageQuota) {
          await tblPromo.update(
            {
              usageQuota: data.usageQuota - 1,
            },
            { where: { id: data.id } }
          );
        }

        res.status(200).json({
          Message: "Success Add Promo !",
          Code_Voucher: req.body.code,
        });
      } else {
        // const dataPackages = await tblPackageMemberships.findAll();
        // let dataku = [];
        // await dataPackages.forEach((el) => {
        //   dataku.push({
        //     packageId: el.packageMembershipId,
        //     price: el.price - percentage(el.price, data.nominal),
        //   });
        // });
        // const coba = dataku.find((x) => x.packageId == data.product);
        // console.log(coba.price);
        const namePackage = data.tblPackageMembership.package.split(" ")[0];
        const memberPackage = revenueData.find((el) => el.status !== null);
        let successRev = "";
        if (
          namePackage === "Membership" &&
          dataUser.activeExpired &&
          !data.forAll
        ) {
          await tblMember.update(
            {
              activeExpired: moment(dataUser.activeExpired)
                .add(data.tblPackageMembership.times, "days")
                .format("YYYY-MM-DD"),
            },
            { where: { memberId: dataUser.memberId } }
          );
          successRev = await tblRevenue.create({
            memberId: dataUser.memberId,
            keterangan: "Voucher Award",
            dateActiveMembership:
              memberPackage &&
              createDateAsUTC(new Date(dataUser.activeExpired)) >
                createDateAsUTC(new Date())
                ? memberPackage.activeMembershipExpired
                : memberPackage &&
                  createDateAsUTC(new Date(dataUser.activeExpired)) <=
                    createDateAsUTC(new Date())
                ? createDateAsUTC(new Date())
                : createDateAsUTC(new Date(dataUser.activeExpired)),
            activeMembershipExpired: moment(dataUser.activeExpired)
              .add(data.tblPackageMembership.times, "days")
              .format("YYYY-MM-DD"),
            status: !revenueData.length
              ? "OPEN"
              : memberPackage.status == "CLOSED"
              ? "OPEN"
              : memberPackage &&
                createDateAsUTC(new Date(dataUser.activeExpired)) >
                  createDateAsUTC(new Date())
              ? "PENDING"
              : "OPEN",
            packageBefore: memberPackage
              ? memberPackage.packageAfter
              : data.tblPackageMembership.packageMembershipId,
            packageAfter: data.tblPackageMembership.packageMembershipId,
            price:
              data.typeVoucher === "nominal"
                ? data.tblPackageMembership.price - data.nominal
                : data.typeVoucher === "diskon"
                ? data.tblPackageMembership.price -
                  percentage(data.tblPackageMembership.price, data.nominal)
                : data.tblPackageMembership.price,
            times: data.tblPackageMembership.times,
            debit: data.tblPackageMembership.times,
            saldo_member: cekSisaHari(dataUser.activeExpired),
            is_event: true,
          });
        }
        if (successRev)
          res.status(200).json({
            message: "Success",
            member: dataUser.memberId,
            voucher: req.body.code,
          });
        else
          res.status(400).json({
            message: "Failed",
            member: dataUser.memberId,
            voucher: req.body.code,
          });
      }
    } catch (error) {
      next(error);
    }
  }

  //todo: for Member
  static async cancelVoucher(req, res, next) {
    try {
      const { id } = req.params;

      const data = await tblHistoryPromo.findByPk(id, {
        include: { model: tblPromo },
      });
      if (!data) throw { name: "notFound" };
      if (cekSisaHari(data.claimDate) < 0) throw { name: "notFound" };

      const dataOrder = await tblOrderList.findAll({
        where: { transactionId: data.transaction },
        include: [{ model: tblPackageMemberships }, { model: tblTransaction }],
      });

      if (!dataOrder.length) throw { name: "notFound" };

      let promise = [];
      dataOrder.forEach((el) => {
        promise.push(
          tblOrderList.update(
            {
              promoId: null,
            },
            { where: { id: el.id } }
          )
        );
      });
      await Promise.all(promise);

      if (data.tblPromo.usageQuota >= 0 && !data.tblPromo.isUnlimited) {
        await tblPromo.update(
          {
            usageQuota: data.tblPromo.usageQuota + 1,
          },
          { where: { id: data.idVoucher } }
        );
      }

      await tblHistoryPromo.destroy({ where: { id: data.id } });
      res.status(200).json({
        success: true,
        message: `resource deleted successfully for voucher ${data.tblPromo.code}`,
      });
    } catch (error) {
      next(error);
    }
  }

  //todo: for Member
  static async historyMemberVoucher(req, res, next) {
    try {
      const dataUser = await tblUser.findByPk(req.user.userId, {
        include: { model: tblMember },
      });
      const dataHistory = await tblHistoryPromo.findAll({
        where: { memberId: dataUser.tblMember.memberId },
        include: { model: tblPromo },
      });
      // console.log(dataHistory);
      // let history = await tblHistoryPromo.sequelize.query(
      //   "SELECT tblMembers.memberId,tblUsers.fullname,tblClassPts.time,tblClassPts.date,tblClassPts.week,tblClassPts.month,tblClassPts.year,tblRevenues.packagePT,tblRevenues.pricePT,tblRevenues.timesPT FROM `tblHistoryPTs` INNER JOIN `tblMembers` ON tblHistoryPTs.userId = tblMembers.userId LEFT OUTER JOIN tblRevenues ON tblHistoryPTs.revenueId = tblRevenues.id LEFT OUTER JOIN tblClassPts ON tblHistoryPTs.classPtId = tblClassPts.classPtId LEFT OUTER JOIN tblUsers on tblClassPts.ptId = tblUsers.userId",
      //   {
      //     raw: true,
      //     type: QueryTypes.SELECT,
      //   }
      // );
      res.status(200).json({ success: true, histories: dataHistory });
    } catch (error) {
      next(error);
    }
  }
}

function cekSisaHari(args) {
  if (!args) return -30;

  let a = moment().format("YYYY-MM-DD");
  let b = moment(args, "YYYY-MM-DD");

  return b.diff(a, "days");
}

function percentage(a, b) {
  let c = (parseFloat(a) * parseFloat(b)) / 100;
  return parseFloat(c);
}

module.exports = promo;
