const {
  tblUser,
  tblMember,
  tblPackageMemberships,
  tblSubCategoryMembership,
  tblTransaction,
  tblOrderList,
  tblStaff,
  tblRevenue,
  tblTempRevenue,
  tblHistoryPromo,
  tblPackageClasses,
} = require("../models");
const Op = require("sequelize").Op;
const { createDateAsUTC } = require("../helpers/convertDate");
const { rememberExtendPackage } = require("../helpers/schedule");
const {
  mailOptions,
  transporter,
  footerMail,
} = require("../helpers/nodemailer");
const axios = require("axios");
const moment = require("moment");
const xendit = require("../helpers/xendit");

class TransactionController {
  static async create(req, res, next) {
    try {
      let created, idTransaction;
      let expiredDate = new Date();
      if (
        req.body.packageMembershipId === "VIP" ||
        req.body.packageMembershipId === "NVIP"
      ) {
        expiredDate.setHours(new Date().getHours() + 1);
      } else expiredDate.setDate(new Date().getDate() + 1);

      let packageSelected = await tblPackageMemberships.findByPk(
        req.body.packageMembershipId,
        {
          include: [{ model: tblSubCategoryMembership }],
        }
      );
      let member = await tblMember.findByPk(req.body.memberId, {
        include: [{ model: tblUser }],
      });

      let cartExist = await tblTransaction.findOne({
        where: {
          [Op.and]: [{ memberId: req.body.memberId }, { status: "unpaid" }],
        },
      });

      if (cartExist) {
        idTransaction = cartExist.transactionId;
        let updateCart = {
          amount: cartExist.amount + req.body.amount,
          updatedAt: createDateAsUTC(new Date()),
          expiredAt: createDateAsUTC(expiredDate),
        };
        if (
          (cekSisaHari(member.activeExpired) <= -7 ||
            member.packageMembershipId === "Trial" ||
            member.packageMembershipId === "1DP" ||
            !member.packageMembershipId) &&
          (req.body.categoryMembershipId === 1 ||
            req.body.categoryMembershipId === 9)
        ) {
          updateCart.admPrice =
            cartExist.admPrice +
            packageSelected.tblSubCategoryMembership.adminFee;
          updateCart.amount = updateCart.amount + updateCart.admPrice;
        }

        await tblTransaction.update(updateCart, {
          where: { transactionId: cartExist.transactionId },
        });

        let orderData = {
          transactionId: cartExist.transactionId,
          packageMembershipId: req.body.packageMembershipId,
          categoryMembershipId: req.body.categoryMembershipId,
          quantity: req.body.quantity,
          totalPrice: req.body.amount,
          createdAt: createDateAsUTC(new Date()),
          updatedAt: createDateAsUTC(new Date()),
          expiredAt: createDateAsUTC(expiredDate),
        };
        created = await tblOrderList.create(orderData);
      } else {
        let transactionData = {
          memberId: req.body.memberId,
          amount: req.body.amount,
          inputMethod: "Website",
          status: "unpaid",
          createdAt: createDateAsUTC(new Date()),
          updatedAt: createDateAsUTC(new Date()),
          expiredAt: createDateAsUTC(expiredDate),
        };

        if (
          (cekSisaHari(member.activeExpired) <= -7 ||
            member.packageMembershipId === "Trial" ||
            member.packageMembershipId === "1DP" ||
            !member.packageMembershipId) &&
          (req.body.categoryMembershipId === 1 ||
            req.body.categoryMembershipId === 9)
        ) {
          transactionData.admPrice =
            packageSelected.tblSubCategoryMembership.adminFee;
          transactionData.amount =
            transactionData.amount + transactionData.admPrice;
        }
        await tblTransaction.create(transactionData);

        let { transactionId } = await tblTransaction.findOne({
          where: {
            [Op.and]: [{ memberId: req.body.memberId }, { status: "unpaid" }],
          },
        });
        let orderData = {
          transactionId,
          packageMembershipId: req.body.packageMembershipId,
          categoryMembershipId: req.body.categoryMembershipId,
          quantity: req.body.quantity,
          totalPrice: req.body.amount,
          createdAt: createDateAsUTC(new Date()),
          updatedAt: createDateAsUTC(new Date()),
        };
        created = await tblOrderList.create(orderData);
        idTransaction = transactionId;
      }

      if (req.body.leaveDate) {
        await tblMember.update(
          {
            leaveDate: createDateAsUTC(new Date(req.body.leaveDate)),
            leaveStatus: "UNPAID",
          },
          { where: { memberId: req.body.memberId } }
        );
      }

      if (created) {
        res.status(201).json({ Message: "Transaction Created", Data: created });
      }
    } catch (error) {
      next(error);
    }
  }

  static async findAll(req, res, next) {
    try {
      let data = await tblTransaction.findAll({
        include: [
          {
            model: tblMember,
            as: "member",
            attributes: ["memberId"],
          },
          {
            model: tblOrderList,
            include: {
              model: tblPackageMemberships,
              attributes: ["subCategoryMembershipId", "times"],
              include: {
                model: tblSubCategoryMembership,
                attributes: ["adminFee"],
              },
            },
          },
          {
            model: tblStaff,
            attributes: ["userId"],
            include: { model: tblUser, as: "staff", attributes: ["nickname"] },
          },
          {
            model: tblStaff,
            as: "sales",
            attributes: ["userId"],
            include: { model: tblUser, as: "staff", attributes: ["nickname"] },
          },
          {
            model: tblStaff,
            as: "cashier",
            attributes: ["userId"],
            include: { model: tblUser, as: "staff", attributes: ["nickname"] },
          },
        ],
        order: [["createdAt", "DESC"]],
      });
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  static async checkout(req, res, next) {
    try {
      // CEK LAST INVOICE NUMBER
      let dataTransaction = await tblTransaction.findOne({
        where: { salesInvoice: { [Op.not]: null } },
        order: [["salesInvoice", "DESC"]],
      });

      // SETTING UNIQUE CODE INVOICE
      let uniqueMonth =
        new Date().getMonth() + 1 < 10
          ? `0${new Date().getMonth() + 1}`
          : new Date().getMonth() + 1;
      let code =
        dataTransaction && dataTransaction.salesInvoice
          ? +dataTransaction.salesInvoice.slice(9) + 1
          : 11;
      if (code < 100) code = `00${code}`;
      else if (code < 1000) code = `0${code}`;

      // FIX UNIQUE CODE
      let salesInvoice = `MPSI-${String(new Date().getFullYear()).slice(
        2
      )}${uniqueMonth}${code}`;

      // CHECK ADA ADMIN FEE ATAU TIDAK
      let adminFee = req.body.cart.find((el) => el.package === "Admin Fee");

      // CHECK STAFF
      let staff = await tblStaff.findOne({
        where: { userId: req.user.userId },
      });

      //todo: check transaction and user client for payment (onGoingTransaction)
      let seeTrans = await tblTransaction.findOne({
        where: {
          memberId: req.body.memberId,
        },
        order: [["createdAt", "DESC"]],
      });
      let member = await tblMember.findOne({
        where: { memberId: req.body.memberId },
        include: { model: tblUser },
      });

      let transactionData = {
        memberId: req.body.memberId,
        salesId: req.body.salesId,
        cashierId: staff.staffId,
        staffId: req.body.methodPayment === "CASHLEZ" ? staff.staffId : null,
        methodPayment: req.body.methodPayment,
        amount: member.tblUser.agreePromo ? seeTrans.amount : req.body.amount,
        admPrice: adminFee ? adminFee.price : null,
        status:
          req.body.methodPayment === "CASHLEZ"
            ? "unpaid"
            : req.body.methodPayment === "EDC"
            ? "paid"
            : "transferred",
        salesInvoice:
          req.body.methodPayment === "CASHLEZ" ? null : salesInvoice,
        inputMethod: "POS",
        createdAt: createDateAsUTC(new Date()),
        updatedAt: createDateAsUTC(new Date()),
        expiredAt:
          req.body.methodPayment === "CASHLEZ"
            ? moment(new Date()).add(2, "days").format("YYYY-MM-DD")
            : null,
      };

      if (req.body.methodPayment === "EDC") {
        transactionData = {
          ...transactionData,
          namaPemilikKartu: req.body.namaPemilikKartu,
          bankKartu: req.body.bankKartu,
          bankTujuan: req.body.bankTujuan,
          typeOfCard: req.body.typeOfCard,
          lastDigit: req.body.lastDigit,
          paymentDate: createDateAsUTC(new Date()),
        };
      } else if (req.body.methodPayment === "TOKOPEDIA") {
        transactionData = {
          ...transactionData,
          namaDitransaksi: req.body.namaDitransaksi,
          invoiceNumber: req.body.invoiceNumber,
          totalPayment: req.body.totalPayment,
          paymentDate: createDateAsUTC(new Date(req.body.datePayment)),
        };
      } else if (req.body.methodPayment === "TRANSFER") {
        transactionData = {
          ...transactionData,
          namaRekening: req.body.namaRekening,
          bankAsal: req.body.bankAsal,
          bankTujuan: req.body.bankTujuan,
          paymentDate: createDateAsUTC(new Date(req.body.datePayment)),
        };
      }

      if (req.body.onGoingTransactionId)
        await tblTransaction.update(transactionData, {
          where: { transactionId: req.body.onGoingTransactionId },
        });
      else await tblTransaction.create(transactionData);

      let { transactionId } = await tblTransaction.findOne({
        where: {
          memberId: req.body.memberId,
        },
        order: [["createdAt", "DESC"]],
      });

      // FILTER CART DARI ADMIN FEE
      let fixedCart = req.body.cart.filter((el) => el.packageMembershipId);

      if (req.body.onGoingTransactionId) {
        let promises = [];

        fixedCart.forEach((el) => {
          promises.push(
            tblOrderList.update(
              {
                salesInvoice:
                  req.body.methodPayment === "CASHLEZ" ? null : salesInvoice,
              },
              { where: { transactionId: req.body.onGoingTransactionId } }
            )
          );
        });

        await Promise.all(promises);
      } else {
        let orderData = [];

        fixedCart.forEach((el) => {
          orderData.push({
            transactionId,
            salesInvoice:
              req.body.methodPayment === "CASHLEZ" ? null : salesInvoice,
            packageMembershipId: el.packageMembershipId,
            categoryMembershipId: el.categoryMembershipId,
            quantity: 1,
            totalPrice: el.price,
            createdAt: createDateAsUTC(new Date()),
            updatedAt: createDateAsUTC(new Date()),
          });
        });

        await tblOrderList.bulkCreate(orderData);
      }

      let cart = await tblOrderList.findAll({
        where: { transactionId },
        include: { model: tblPackageMemberships },
      });

      // BUAT CUTI
      if (req.body.leaveDate) {
        let data = {
          leaveDate: createDateAsUTC(new Date(req.body.leaveDate)),
          leaveStatus: req.body.methodPayment === "CASHLEZ" ? "UNPAID" : "PAID",
        };
        if (
          req.body.methodPayment === "TRANSFER" ||
          req.body.methodPayment === "TOKOPEDIA" ||
          req.body.methodPayment === "EDC"
        ) {
          let paketLeave = cart.find((el) => el.categoryMembershipId === 4);
          data.activeExpired = createDateAsUTC(
            new Date(
              new Date(member.activeExpired).getFullYear(),
              new Date(member.activeExpired).getMonth(),
              new Date(member.activeExpired).getDate() +
                ((paketLeave && paketLeave.times) || 0)
            )
          );
        }
        await tblMember.update(data, {
          where: { memberId: req.body.memberId },
        });
      }

      // UPDATE DATA
      if (req.body.methodPayment === "EDC") {
        let paketMember = cart.find(
          (el) =>
            el.categoryMembershipId === 1 ||
            (el.categoryMembershipId === 8) | (el.categoryMembershipId === 9)
        );
        let paketPT = cart.find((el) => el.categoryMembershipId === 2);
        let paketOnline = cart.find((el) => el.categoryMembershipId === 5);
        let paketLeave = cart.find((el) => el.categoryMembershipId === 4);
        let paketKelas = cart.find((el) => el.categoryMembershipId === 6);
        let paketPG = cart.find(
          (el) =>
            el.packageMembershipId === "NVIP" ||
            el.packageMembershipId === "VIP"
        );

        let data = {
          activeExpired:
            cekSisaHari(member.activeExpired) > 0 &&
            member.packageMembershipId !== "Trial"
              ? moment(member.activeExpired)
                  .add(
                    (paketMember && paketMember.tblPackageMembership.times) ||
                      0,
                    "days"
                  )
                  .add(
                    (paketLeave && paketLeave.tblPackageMembership.times) || 0,
                    "days"
                  )
                  .format("YYYY-MM-DD")
              : // createDateAsUTC(
                //     new Date(
                //       new Date(member.activeExpired).getFullYear(),
                //       new Date(member.activeExpired).getMonth(),
                //       new Date(member.activeExpired).getDate() +
                //         ((paketMember &&
                //           paketMember.tblPackageMembership.times) ||
                //           0) +
                //         ((paketLeave && paketLeave.tblPackageMembership.times) ||
                //           0)
                //     )
                //   )
                moment()
                  .add(
                    (paketMember && paketMember.tblPackageMembership.times) ||
                      0,
                    "days"
                  )
                  .add(
                    (paketLeave && paketLeave.tblPackageMembership.times) || 0,
                    "days"
                  )
                  .format("YYYY-MM-DD"),
          // paketMember &&
          //   createDateAsUTC(
          //     new Date(
          //       new Date().getFullYear(),
          //       new Date().getMonth(),
          //       new Date().getDate() +
          //         ((paketMember &&
          //           paketMember.tblPackageMembership.times) ||
          //           0) +
          //         ((paketLeave && paketLeave.tblPackageMembership.times) ||
          //           0)
          //     )
          //   ),
          ptSession:
            member.ptSession +
            ((paketPT && paketPT.tblPackageMembership.times) || 0),
          ptSessionOnline:
            member.ptSessionOnline +
            ((paketOnline && paketOnline.tblPackageMembership.times) || 0),
        };

        let revenueData = {
          memberId: req.body.memberId,
        };

        if (paketMember) {
          if (member.packageMembershipId === "Trial") data.activeDate = null;
          data.packageMembershipId =
            member.packageMembershipId !== "1DP" &&
            paketMember.tblPackageMembership.packageMembershipId === "1DP" &&
            member.packageMembershipId
              ? member.packageMembershipId
              : paketMember.tblPackageMembership.packageMembershipId;
          revenueData.dateActiveMembership = paketLeave
            ? createDateAsUTC(
                new Date(moment(new Date(member.activeExpired)).add(30, "days"))
              )
            : cekSisaHari(member.activeExpired) > 0
            ? moment(member.activeExpired).format("YYYY-MM-DD")
            : // createDateAsUTC(new Date(member.activeExpired))
              moment().format("YYYY-MM-DD");
          // createDateAsUTC(new Date());
          revenueData.price = member.tblUser.agreePromo
            ? paketMember.totalPrice
            : paketMember.tblPackageMembership.price;
          revenueData.packageBefore = member.packageMembershipId;
          revenueData.packageAfter =
            paketMember.tblPackageMembership.packageMembershipId;
          revenueData.times = paketMember.tblPackageMembership.times;
          revenueData.debit = paketMember.tblPackageMembership.times;
          revenueData.activeMembershipExpired = data.activeExpired;
          revenueData.saldo_member = member.isLeave
            ? cekSisaHari(data.activeExpired) -
              (30 - cekSisaCuti(new Date(), new Date(member.leaveDate)))
            : cekSisaHari(data.activeExpired);
          revenueData.status =
            cekSisaHari(member.activeExpired) > 0 ||
            !member.activeDate ||
            member.packageMembershipId === "Trial"
              ? "PENDING"
              : "OPEN";
          revenueData.keterangan = salesInvoice;
          revenueData.is_event = false;
        }

        // UPDATE DATA SETELAH PEMBAYARAN
        if (paketMember || paketPT || paketLeave || paketPG) {
          revenueData.pricePT = member.tblUser.agreePromo
            ? paketPT?.totalPrice
            : paketPT?.tblPackageMembership?.price;
          revenueData.packagePT =
            paketPT && paketPT.tblPackageMembership.packageMembershipId;
          revenueData.timesPT = paketPT && paketPT.tblPackageMembership.times;
          revenueData.keterangan = salesInvoice;
          data.packagePTId =
            paketPT && paketPT.tblPackageMembership.packageMembershipId;
          data.sisaLastPTSession = paketPT && member.ptSession;
          data.leaveStatus = paketLeave && "PAID";
          data.PG_Session =
            paketPG && !member.PG_Session ? 1 : member.PG_Session + 1;
          await tblMember.update(data, {
            where: { memberId: member.memberId },
          });
          await tblRevenue.create(revenueData);
        }

        // for classPackage checkout
        if (paketKelas) {
          let classPackage = await tblPackageClasses.create({
            expiredDate: createDateAsUTC(
              new Date(
                new Date().getFullYear(),
                new Date().getMonth(),
                new Date().getDate() +
                  (paketKelas.tblPackageMembership.times || 0)
              )
            ),
            memberId: member.memberId,
            subCategoryMembershipId:
              paketKelas.tblPackageMembership.subCategoryMembershipId,
            classSession: paketKelas.tblPackageMembership.classUsed,
            activeDate: createDateAsUTC(new Date()),
          });
          await tblRevenue.create({
            memberId: req.body.memberId,
            keterangan: salesInvoice,
            dateActiveMembership: createDateAsUTC(new Date()),
            activeMembershipExpired: classPackage.expiredDate,
            status: "OPEN",
            packageBefore: paketKelas.tblPackageMembership.package,
            times: paketKelas.tblPackageMembership.classUsed,
            kredit: 0,
            price: paketKelas.tblPackageMembership.price,
          });
        }

        if (paketMember || paketPT || paketKelas) {
          await tblUser.update(
            { agreePromo: false, flagActive: true },
            { where: { userId: member.userId } }
          );
        }
      }

      //   if (req.body.methodPayment === "CASHLEZ") {
      //     let bill = {
      //       expired_date: moment(new Date()).add(1, "days").format("YYYY-MM-DD"),
      //       merchant_id: "b1RUMTFrUkVHZjg5VXN3NzJyL2wvdz09",
      //       merchant_txid: transactionId,
      //       amount: req.body.amount, // GANTI SINI JADI AMOUNT YG SEBENARNYA
      //       mobile_user_id: "eHJnS2l5bkZMQTltVENQanpqVXZYdz09",
      //       description: "Megafit POS Payment",
      //       name: req.body.name,
      //       address_line1: "Greatwall A21-25",
      //       address_line2: "City Ruko Wallstreet",
      //       country: "Indonesia",
      //       state: "Banten",
      //       city: "Tangerang",
      //       district: "Cipondoh",
      //       village: "Green Lake",
      //       postcode: "15147",
      //       transaction_type: "ALL",
      //       card_type: "ALL",
      //       processing_type: "ALL",
      //       callback_url: "", // GANTI SINI JADI BASE URL
      //     };

      //     let { data: password } = await axios.post("https://secure.cashlez.com/api-v2/v2/encrypt", {
      //       password: process.env.CASHLEZ_PASS,
      //     });

      //     let { data: login } = await axios.post("https://secure.cashlez.com/api-v2/v2/guest/login", {
      //       username: "pola-megafit",
      //       password: password.encrypted_password,
      //     });

      //     let { data: created } = await axios.post("https://secure.cashlez.com/api-v2/v2/mcc/bill/create", bill, {
      //       headers: { Authorization: "Bearer " + login.token },
      //     });

      //     await tblCashlez.create({
      //       bill_id: created.bill_id,
      //       transactionId,
      //       status: "open",
      //       expiredAt: moment(new Date()).add(2, "days").format("YYYY-MM-DD"),
      //     });

      //     res.status(200).json({
      //       Message: "Success Create Cashlez Bill !",
      //       bill_id: created.bill_id,
      //       transactionId,
      //     });
      //   } else {
      //     res.status(200).json({
      //       Message: "Success Checkout Member !",
      //       invoice: salesInvoice,
      //     });
      // }
      res.status(200).json({
        Message: "Success Checkout Member !",
        invoice: salesInvoice,
      });

      // BAGIAN EMAIL TRANSAKSI
      if (req.body.methodPayment !== "CASHLEZ") {
        let transaction = await tblTransaction.findByPk(transactionId, {
          include: [
            {
              model: tblOrderList,
              include: [{ model: tblPackageMemberships }],
            },
          ],
        });
        let user = await tblUser.findByPk(member.userId);
        let order = "";

        await transaction.tblOrderLists.forEach((element) => {
          order =
            order +
            `<div style="display:flex;margin-left:30px;">
						<div style="width:350px;">
							<p style="margin:5px;margin-left: 0px;">${
                element.tblPackageMembership.package
              } ${element.tblPackageMembership.times} ${
              element.categoryMembershipId !== 2 ||
              element.categoryMembershipId !== 2
                ? "Hari"
                : "Sesi"
            }</p>
						</div>
						<div>
							<p style="margin:5px;margin-left: 0px;">Rp ${convertRupiah(
                element.totalPrice
              )}</p>
						</div>
					</div>`;
        });

        mailOptions.to = user.email;
        mailOptions.subject = "Terima kasih atas transaksi di Megafit";
        mailOptions.html = `
				<img src="http://209.97.175.174:3000/asset/img/pola-megafit_black.png" height="30" width="150" alt="logo-megafit" />
				<p style="font-size: 20px;margin-bottom: 5px;"><b>Terima kasih telah belanja di Megafit</b></p>
				<p style="margin:0px 0px 10px 0px;color:#91c640">Lebih sedikit kertas, lebih hijau! Pilihan Megarangers membuat dunia lebih baik.</p>

				<p style="margin:15px 0px;"><b>Berikut merupakan detil pembelian di Megafit pada tanggal ${getDate(
          new Date(transaction.createdAt)
        )}</b></p>

				<div id="table-order" style="margin-bottom: 20px;">
					<div style="background-color:#dcdcdc;padding:10px 30px;margin-top:20px;width:500px">
						<p style="margin:0px;"><b>Invoice No: ${salesInvoice}</b></p>
					</div>
					<p style="margin: 10px 0px 10px 30px;"><b>Paket dipilih</b></p>

					${order}

					<div style="display:flex;margin-left:30px;">
						<div style="width:350px;">
							<p style="margin:5px;margin-left: 0px;">Admin Fee</p>
						</div>
						<div>
							<p style="margin:5px;margin-left: 0px;">Rp ${
                transaction.admPrice ? convertRupiah(transaction.admPrice) : 0
              }</p>
						</div>
					</div>
					<div style="border-top:1px solid #aaa;font-size:0;margin:8px 30px;width: 500px;"></div>
					<div style="display:flex;margin-left:30px;">
						<div style="width:350px;">
							<p style="margin:5px;margin-left: 0px;">Total</p>
						</div>
						<div>
							<p style="margin:5px;margin-left: 0px;">Rp ${convertRupiah(
                transaction.amount
              )}</p>
						</div>
					</div>
				</div>

				<div style="border-top:1px solid #aaa;font-size:0;margin:8px auto;"></div>
				<div style="text-align:center;font-size: small;">
					<b>Email ini dibuat secara otomatis. Mohon tidak mengirim balasan ke email ini.</b>
				</div>
				<div style="border-top:1px solid #aaa;font-size:0;margin:8px auto;"></div>
				<p style="font-size: x-small;">* Transaksi sukses tidak bisa dibatalkan dan uang yang telah dibayarkan tidak bisa dikembalikan.</p>
				<p style="font-size: x-small;">* Email ini dikirimkan ke ${
          mailOptions.to
        } karena kamu telah memilih untuk menerima salinan tanda terima elektronik.</p>

				${footerMail}
				`;

        await transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log("GAGAL");
            console.log(error);
          } else {
            console.log(mailOptions.to);
            console.log("Berhasil");
          }
        });

        await rememberExtendPackage(req.body.memberId);
      }
    } catch (error) {
      next(error);
    }
  }

  static async findOne(req, res, next) {
    try {
      let data;
      if (req.query.cashlez === "true") {
        data = await tblTransaction.findOne({
          where: { transactionId: req.params.id },
        });
      } else if (req.query.pos === "true") {
        data = await tblTransaction.findOne({
          where: {
            [Op.and]: [{ memberId: req.params.id }, { status: "unpaid" }],
          },
          include: [
            { model: tblOrderList, include: { model: tblPackageMemberships } },
          ],
        });
      } else {
        data = await tblTransaction.findOne({
          where: {
            [Op.and]: [
              { memberId: req.params.id },
              {
                [Op.or]: [
                  { status: "unpaid" },
                  { status: "transferred" },
                  { status: "denied" },
                ],
              },
            ],
          },
          include: [
            { model: tblMember, as: "member" },
            { model: tblOrderList, include: { model: tblPackageMemberships } },
          ],
        });
      }
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      if (req.query.transferred === "true") {
        let transaction = await tblTransaction.findOne({
          where: { transactionId: req.params.id },
          include: [{ model: tblOrderList }],
        });

        let cart = await tblOrderList.findAll({
          where: { transactionId: req.params.id },
          include: { model: tblPackageMemberships },
        });

        let member = await tblMember.findOne({
          where: { memberId: transaction.memberId },
          include: { model: tblUser },
        });

        let {
          amount,
          methodPayment,
          namaRekening,
          bankAsal,
          keterangan,
          paymentDate,
        } = req.body;

        let data;
        if (req.body.paymentMethod === "TRANSFER") {
          data = {
            amount,
            methodPayment: "TRANSFER",
            bankTujuan: methodPayment,
            namaRekening,
            bankAsal,
            keterangan,
            paymentDate,
            status: "transferred",
            expiredAt: null,
          };
        } else {
          data = {
            methodPayment: req.body.paymentMethod,
            namaDitransaksi: req.body.namaDitransaksi,
            invoiceNumber: req.body.invoiceNumber,
            totalPayment: req.body.totalPembayaran,
            paymentDate,
            status: "transferred",
            expiredAt: null,
          };
        }

        let paketLeave = cart.find((el) => el.categoryMembershipId === 4);
        await tblTransaction.update(data, {
          where: { transactionId: transaction.transactionId },
        });

        if (paketLeave) {
          let data = {
            activeExpired: createDateAsUTC(
              new Date(
                new Date(member.activeExpired).getFullYear(),
                new Date(member.activeExpired).getMonth(),
                new Date(member.activeExpired).getDate() +
                  paketLeave.tblPackageMembership.times
              )
            ),
            leaveStatus: "PAID",
          };

          await tblMember.update(data, {
            where: { memberId: transaction.memberId },
          });
        }
        res.status(200).json({ Message: "Success Update Transaction !" });
      } else if (req.query.denied === "true") {
        let staff = await tblStaff.findOne({
          where: { userId: req.user.userId },
        });

        await tblTransaction.update(
          {
            status: req.body.transactionStatus,
            staffId: staff.staffId,
            deniedReason: req.body.deniedReason,
          },
          { where: { transactionId: req.params.id } }
        );

        let transaction = await tblTransaction.findByPk(req.params.id, {
          include: [{ model: tblOrderList }],
        });
        let orderLeave = await transaction.tblOrderLists.find(
          (el) => el.categoryMembershipId === 4
        );

        if (orderLeave && req.body.transactionStatus === "denied") {
          let member = await tblMember.findByPk(transaction.memberId);
          let data = {
            activeExpired: createDateAsUTC(
              new Date(
                new Date(member.activeExpired).getFullYear(),
                new Date(member.activeExpired).getMonth(),
                new Date(member.activeExpired).getDate() - 30
              )
            ),
            isLeave: null,
            leaveDate: null,
            leaveStatus: null,
          };
          await tblMember.update(data, {
            where: { memberId: transaction.memberId },
          });
          await tblRevenue.destroy({
            where: {
              status: "OPEN",
              memberId: transaction.memberId,
            },
          });

          // let tempRevenue = await tblTempRevenue.findAll({
          //   where: {
          //     memberId: transaction.memberId,
          //   },
          // });

          // let promises = [];
          // tempRevenue.forEach((x) => {
          //   let data = {
          //     ...x.dataValues,
          //   };
          //   delete data.id;
          //   delete data.revenueId;

          //   promises.push(
          //     tblRevenue.update(data, {
          //       where: {
          //         id: x.revenueId,
          //       },
          //     })
          //   );
          // });

          // promises.push(
          //   tblTempRevenue.destroy({
          //     where: {
          //       memberId: transaction.memberId,
          //     },
          //   })
          // );
          // await Promise.all(promises);
        }

        res.status(200).json({ Message: "Success Denied Paid Member !" });
      } else {
        let cart = await tblOrderList.findAll({
          where: { transactionId: req.params.id },
          include: { model: tblPackageMemberships },
        });

        let member = await tblMember.findOne({
          where: { memberId: req.body.memberId },
          include: { model: tblUser },
        });
        let staff = await tblStaff.findOne({
          where: { userId: req.user.userId },
        });

        let paketMember = cart.find(
          (el) =>
            el.categoryMembershipId === 1 ||
            (el.categoryMembershipId === 8) | (el.categoryMembershipId === 9)
        );
        let paketPT = cart.find((el) => el.categoryMembershipId === 2);
        let paketOnline = cart.find((el) => el.categoryMembershipId === 5);
        let paketPG = cart.find(
          (el) =>
            el.packageMembershipId === "NVIP" ||
            el.packageMembershipId === "VIP"
        );

        // CEK LAST INVOICE NUMBER
        let dataTransaction = await tblTransaction.findOne({
          where: { salesInvoice: { [Op.not]: null } },
          order: [["salesInvoice", "DESC"]],
        });

        // SETTING UNIQUE CODE INVOICE
        let uniqueMonth =
          new Date().getMonth() + 1 < 10
            ? `0${new Date().getMonth() + 1}`
            : new Date().getMonth() + 1;
        let code =
          dataTransaction && dataTransaction.salesInvoice
            ? +dataTransaction.salesInvoice.slice(9) + 1
            : 11;
        if (code < 100) code = `00${code}`;
        else if (code < 1000) code = `0${code}`;

        // FIX UNIQUE CODE
        let salesInvoice = `MPSI-${String(new Date().getFullYear()).slice(
          2
        )}${uniqueMonth}${code}`;

        let data = {
          activeExpired:
            cekSisaHari(member.activeExpired) > 0 &&
            member.packageMembershipId !== "Trial"
              ? createDateAsUTC(
                  new Date(
                    new Date(member.activeExpired).getFullYear(),
                    new Date(member.activeExpired).getMonth(),
                    new Date(member.activeExpired).getDate() +
                      ((paketMember &&
                        paketMember.tblPackageMembership.times) ||
                        0)
                  )
                )
              : paketMember &&
                createDateAsUTC(
                  new Date(
                    new Date().getFullYear(),
                    new Date().getMonth(),
                    new Date().getDate() +
                      ((paketMember &&
                        paketMember.tblPackageMembership.times) ||
                        0)
                  )
                ),
          ptSession:
            member.ptSession +
            ((paketPT && paketPT.tblPackageMembership.times) || 0),
          ptSessionOnline:
            member.ptSessionOnline +
            ((paketOnline && paketOnline.tblPackageMembership.times) || 0),
        };

        let revenueData = {
          memberId: req.body.memberId,
        };

        if (paketMember) {
          if (member.packageMembershipId === "Trial") data.activeDate = null;
          if (cekSisaHari(member.activeExpired) <= 0) {
            data.packageMembershipId =
              member.packageMembershipId !== "1DP" &&
              paketMember.packageMembershipId === "1DP" &&
              member.packageMembershipId
                ? member.packageMembershipId
                : paketMember.packageMembershipId;
          }
          revenueData.dateActiveMembership =
            cekSisaHari(member.activeExpired) > 0
              ? createDateAsUTC(new Date(member.activeExpired))
              : createDateAsUTC(new Date());
          revenueData.price = paketMember.tblPackageMembership.price;
          revenueData.packageBefore = member.packageMembershipId;
          revenueData.packageAfter =
            paketMember.tblPackageMembership.packageMembershipId;
          revenueData.times = paketMember.tblPackageMembership.times;
          revenueData.debit = paketMember.tblPackageMembership.times;
          revenueData.activeMembershipExpired = data.activeExpired;
          revenueData.saldo_member = member.isLeave
            ? cekSisaHari(data.activeExpired) -
              (30 - cekSisaCuti(new Date(), new Date(member.leaveDate)))
            : cekSisaHari(data.activeExpired);
          revenueData.status =
            cekSisaHari(member.activeExpired) > 0 ||
            !member.activeDate ||
            member.packageMembershipId === "Trial"
              ? "PENDING"
              : "OPEN";
          revenueData.is_event = false;

          await tblUser.update(
            { flagActive: true },
            { where: { userId: member.userId } }
          );
        }

        if (paketPT) {
          data.packagePTId = paketPT.tblPackageMembership.packageMembershipId;
          data.sisaLastPTSession = member.ptSession;
          revenueData.packagePT =
            paketPT.tblPackageMembership.packageMembershipId;
          revenueData.pricePT = paketPT.tblPackageMembership.price;
          revenueData.timesPT = paketPT.tblPackageMembership.times;
        }

        if (paketPG) {
          data.PG_Session = !member.PG_Session ? 1 : member.PG_Session + 1;
        }

        // CREATE REVENUE DATA
        if (paketMember || paketPT) {
          revenueData.keterangan = salesInvoice;
          await tblRevenue.create(revenueData);
        }
        // UPDATE DATA SETELAH PEMBAYARAN
        await tblMember.update(data, {
          where: { memberId: req.body.memberId },
        });

        let transactionUpdate = {
          status: "paid",
          staffId: staff.staffId,
          deniedReason: null,
        };
        if (req.body.inputMethod !== "POS")
          transactionUpdate.salesInvoice = salesInvoice;

        await tblTransaction.update(transactionUpdate, {
          where: { transactionId: req.params.id },
        });

        // if (req.body.inputMethod !== "POS") {
        //   await tblOrderList.update({ salesInvoice }, { where: { transactionId: req.params.id } });

        //   let orderList = await tblOrderList.findAll({
        //     where: { transactionId: req.params.id, categoryMembershipId: 6 },
        //     include: [{ model: tblPackageMemberships }],
        //   });

        //   orderList.length > 0 &&
        //     (await orderList.forEach(async (order) => {
        //       let before = await tblMemberClasses.findOne({
        //         where: {
        //           memberId: req.body.memberId,
        //           subCategoryMembershipId: order.tblPackageMembership.subCategoryMembershipId,
        //         },
        //       });

        //       let newData = {
        //         memberId: req.body.memberId,
        //         subCategoryMembershipId: order.tblPackageMembership.subCategoryMembershipId,
        //         times: before ? before.times + order.tblPackageMembership.times : order.tblPackageMembership.times,
        //         // expired
        //       };

        //       if (before)
        //         await tblMemberClasses.update(newData, {
        //           where: { id: before.id },
        //         });
        //       else await tblMemberClasses.create(newData);
        //     }));
        // }

        res.status(200).json({ Message: "Success Paid Member !" });

        if (req.body.inputMethod !== "POS") {
          let transaction = await tblTransaction.findByPk(req.params.id, {
            include: [
              {
                model: tblOrderList,
                include: [{ model: tblPackageMemberships }],
              },
            ],
          });
          let user = await tblUser.findByPk(member.userId);
          let order = "";

          await transaction.tblOrderLists.forEach((element) => {
            order =
              order +
              `<div style="display:flex;margin-left:30px;">
						<div style="width:350px;">
							<p style="margin:5px;margin-left: 0px;">${
                element.tblPackageMembership.package
              } ${element.tblPackageMembership.times} ${
                element.categoryMembershipId !== 2 ||
                element.categoryMembershipId !== 2
                  ? "Hari"
                  : "Sesi"
              }</p>
						</div>
						<div>
							<p style="margin:5px;margin-left: 0px;">Rp ${convertRupiah(
                element.totalPrice
              )}</p>
						</div>
					</div>`;
          });

          mailOptions.to = user.email;
          mailOptions.subject = "Terima kasih atas transaksi di Megafit";
          mailOptions.html = `
				<img src="http://209.97.175.174:3000/asset/img/pola-megafit_black.png" height="30" width="150" alt="logo-megafit" />
				<p style="font-size: 20px;margin-bottom: 5px;"><b>Terima kasih telah belanja di Megafit</b></p>
				<p style="margin:0px 0px 10px 0px;color:#91c640">Lebih sedikit kertas, lebih hijau! Pilihan Megarangers membuat dunia lebih baik.</p>

				<p style="margin:15px 0px;"><b>Berikut merupakan detil pembelian di Megafit pada tanggal ${getDate(
          new Date(transaction.createdAt)
        )}</b></p>

				<div id="table-order" style="margin-bottom: 20px;">
					<div style="background-color:#dcdcdc;padding:10px 30px;margin-top:20px;width:500px">
						<p style="margin:0px;"><b>Invoice No: ${salesInvoice}</b></p>
					</div>
					<p style="margin: 10px 0px 10px 30px;"><b>Paket dipilih</b></p>

					${order}

					<div style="display:flex;margin-left:30px;">
						<div style="width:350px;">
							<p style="margin:5px;margin-left: 0px;">Admin Fee</p>
						</div>
						<div>
							<p style="margin:5px;margin-left: 0px;">Rp ${
                transaction.admPrice ? convertRupiah(transaction.admPrice) : 0
              }</p>
						</div>
					</div>
					<div style="border-top:1px solid #aaa;font-size:0;margin:8px 30px;width: 500px;"></div>
					<div style="display:flex;margin-left:30px;">
						<div style="width:350px;">
							<p style="margin:5px;margin-left: 0px;">Total</p>
						</div>
						<div>
							<p style="margin:5px;margin-left: 0px;">Rp ${convertRupiah(
                transaction.amount
              )}</p>
						</div>
					</div>
				</div>

				<div style="border-top:1px solid #aaa;font-size:0;margin:8px auto;"></div>
				<div style="text-align:center;font-size: small;">
					<b>Email ini dibuat secara otomatis. Mohon tidak mengirim balasan ke email ini.</b>
				</div>
				<div style="border-top:1px solid #aaa;font-size:0;margin:8px auto;"></div>
				<p style="font-size: x-small;">* Transaksi sukses tidak bisa dibatalkan dan uang yang telah dibayarkan tidak bisa dikembalikan.</p>
				<p style="font-size: x-small;">* Email ini dikirimkan ke ${
          mailOptions.to
        } karena kamu telah memilih untuk menerima salinan tanda terima elektronik.</p>

				${footerMail}
				`;

          await transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              console.log("GAGAL");
              console.log(error);
            } else {
              console.log(mailOptions.to);
              console.log("Berhasil");
            }
          });

          await rememberExtendPackage(req.body.memberId);
        }
      }
    } catch (error) {
      next(error);
    }
  }

  static async createXenditInvoice(req, res, next) {
    const { transactionId, email, name, phone } = req.body;
    try {
      const transaction = await tblTransaction.findOne({
        where: { transactionId },
        attributes: [
          "transactionId",
          "memberId",
          "amount",
          "createdAt",
          "expiredAt",
          "status",
          "namaRekening",
        ],
        raw: true,
        nest: true,
      });

      if (transaction.status !== "unpaid" || transaction.namaRekening)
        throw { name: "notFound" };

      let member = await tblUser.findOne({
        where: { email },
      });

      const paymentMethod = {
        VA: ["BCA", "BNI", "BRI", "MANDIRI", "PERMATA"],
        CC: ["CREDIT_CARD"],
        QRIS: ["QRIS"],
      };

      const serviceCharge = {
        VA: 5000,
        CC: (transaction.amount * 3.3) / 100 + 2000,
        QRIS: (transaction.amount * 0.71) / 100,
      };

      const invoice = await xendit.createInvoice({
        externalID: `${transactionId}`,
        amount: transaction.amount + serviceCharge[req.body.paymentMethod],
        description: `Megafit Invoice For Transaction ID No.${transactionId}`,
        payerEmail: email,
        customer: {
          email,
          givenNames: name,
          mobileNumber: `+${phone}`,
        },
        successRedirectURL: "https://megafit.co.id",
        shouldSendEmail: true,
        paymentMethods: paymentMethod[req.body.paymentMethod],
        serviceCharge: serviceCharge[req.body.paymentMethod],
      });

      let incomingXenditeDate = new Date(
        moment(new Date(invoice.expiry_date)).subtract(1, "days")
      );
      // incomingXenditeDate.setHours(new Date().getHours() - 1);
      console.log(
        incomingXenditeDate,
        "<---- ini original invoice dari xendit"
      );
      let expiredTrans = new Date(moment(new Date(transaction.expiredAt)));
      console.log(expiredTrans, "<---- ini expired tanggal transaksi");

      // ? cek apakah expired invoice dari xendit lebih besar dari expired transaksi
      if (incomingXenditeDate >= expiredTrans) throw { name: "notFound" };

      await tblTransaction.update(
        {
          expiredAt: createDateAsUTC(new Date(invoice.expiry_date)),
          methodPayment: req.body.paymentMethod,
          namaRekening: invoice.customer.given_names
            ? invoice.customer.given_names
            : member.username,
          xendit_url: invoice.invoice_url,
        },
        {
          where: { transactionId },
        }
      );

      res.status(200).json(invoice.invoice_url);
    } catch (error) {
      if (error.name === "notFound") {
        let data = {
          status: "cancelled",
          deniedReason: "Dibatalkan otomatis oleh sistem.",
          expiredAt: null,
        };
        await tblTransaction.update(data, {
          where: { transactionId },
        });
        res.status(403).json({ message: "Limited Access" });
      } else {
        next(error);
      }
    }
  }

  static async callbackXenditInvoice(req, res, next) {
    try {
      const callbackToken =
        "c264d6379d6d495435f9443e45dd6384b3e6efdb397bff855b4b3a63d3e1e5f6";
      const incomingCallback = req.headers["x-callback-token"]
        ? req.headers["x-callback-token"]
        : null;

      if (incomingCallback === callbackToken) {
        let transaction = await tblTransaction.findOne({
          where: {
            [Op.and]: [
              { transactionId: +req.body.external_id || -1 },
              { xendit_url: { [Op.not]: null } },
            ],
          },
          attributes: [
            "transactionId",
            "memberId",
            "amount",
            "createdAt",
            "expiredAt",
            "methodPayment",
          ],
          include: {
            model: tblOrderList,
            include: { model: tblPackageMemberships },
          },
        });
        if (transaction.methodPayment == "EDC" && transaction.expiredAt == null)
          throw { name: "ok" };
        if (!transaction || !transaction.expiredAt || !req.body.payment_channel)
          throw { name: "notFound" };
        if (req.body.status == "EXPIRED" && transaction.methodPayment == "EDC")
          throw { name: "ok" };
        // new Date(Date.now()) >= new Date(transaction.expiredAt)
        let cart = transaction.tblOrderLists;
        let member = await tblMember.findOne({
          where: { memberId: transaction.memberId },
          include: { model: tblUser },
        });

        let paketMember = cart.find(
          (el) =>
            el.categoryMembershipId === 1 ||
            (el.categoryMembershipId === 8) | (el.categoryMembershipId === 9)
        );
        let paketLeave = cart.find((el) => el.categoryMembershipId === 4);
        let paketPT = cart.find((el) => el.categoryMembershipId === 2);
        let paketOnline = cart.find((el) => el.categoryMembershipId === 5);
        let paketPG = cart.find(
          (el) =>
            el.packageMembershipId === "NVIP" ||
            el.packageMembershipId === "VIP"
        );
        let paketKelas = cart.find((el) => el.categoryMembershipId === 6);

        // CEK LAST INVOICE NUMBER
        let dataTransaction = await tblTransaction.findOne({
          where: { salesInvoice: { [Op.not]: null } },
          order: [["salesInvoice", "DESC"]],
        });

        // SETTING UNIQUE CODE INVOICE
        let uniqueMonth =
          new Date().getMonth() + 1 < 10
            ? `0${new Date().getMonth() + 1}`
            : new Date().getMonth() + 1;
        let code =
          dataTransaction && dataTransaction.salesInvoice
            ? +dataTransaction.salesInvoice.slice(9) + 1
            : 11;
        if (code < 100) code = `00${code}`;
        else if (code < 1000) code = `0${code}`;

        // FIX UNIQUE CODE
        let salesInvoice = `MPSI-${String(new Date().getFullYear()).slice(
          2
        )}${uniqueMonth}${code}`;

        let data = {
          activeExpired:
            cekSisaHari(member.activeExpired) > 0 &&
            member.packageMembershipId !== "Trial"
              ? createDateAsUTC(
                  new Date(
                    new Date(member.activeExpired).getFullYear(),
                    new Date(member.activeExpired).getMonth(),
                    new Date(member.activeExpired).getDate() +
                      ((paketMember &&
                        paketMember.tblPackageMembership.times) ||
                        0) +
                      ((paketLeave && paketLeave.tblPackageMembership.times) ||
                        0)
                  )
                )
              : paketMember &&
                createDateAsUTC(
                  new Date(
                    new Date().getFullYear(),
                    new Date().getMonth(),
                    new Date().getDate() +
                      ((paketMember &&
                        paketMember.tblPackageMembership.times) ||
                        0) +
                      ((paketLeave && paketLeave.tblPackageMembership.times) ||
                        0)
                  )
                ),
          ptSession:
            member.ptSession +
            ((paketPT && paketPT.tblPackageMembership.times) || 0),
          ptSessionOnline:
            member.ptSessionOnline +
            ((paketOnline && paketOnline.tblPackageMembership.times) || 0),
        };

        let revenueData = {
          memberId: transaction.memberId,
        };

        if (paketMember) {
          if (member.packageMembershipId === "Trial") data.activeDate = null;
          if (cekSisaHari(member.activeExpired) <= 0) {
            data.packageMembershipId =
              member.packageMembershipId !== "1DP" &&
              paketMember.packageMembershipId === "1DP" &&
              member.packageMembershipId
                ? member.packageMembershipId
                : paketMember.packageMembershipId;
          }
          revenueData.dateActiveMembership = paketLeave
            ? createDateAsUTC(
                new Date(moment(new Date(member.activeExpired)).add(30, "days"))
              )
            : cekSisaHari(member.activeExpired) > 0
            ? createDateAsUTC(new Date(member.activeExpired))
            : createDateAsUTC(new Date());
          revenueData.price = member.tblUser.agreePromo
            ? paketMember.totalPrice
            : paketMember.tblPackageMembership.price;
          revenueData.packageBefore = member.packageMembershipId;
          revenueData.packageAfter =
            paketMember.tblPackageMembership.packageMembershipId;
          revenueData.times = paketMember.tblPackageMembership.times;
          revenueData.debit = paketMember.tblPackageMembership.times;
          revenueData.activeMembershipExpired = data.activeExpired;
          revenueData.saldo_member = member.isLeave
            ? cekSisaHari(data.activeExpired) -
              (30 - cekSisaCuti(new Date(), new Date(member.leaveDate)))
            : cekSisaHari(data.activeExpired);
          revenueData.status =
            cekSisaHari(member.activeExpired) > 0 ||
            !member.activeDate ||
            member.packageMembershipId === "Trial"
              ? "PENDING"
              : "OPEN";
          revenueData.is_event = false;
        }

        if (paketPT) {
          data.packagePTId = paketPT.tblPackageMembership.packageMembershipId;
          data.sisaLastPTSession = member.ptSession;
          revenueData.packagePT =
            paketPT.tblPackageMembership.packageMembershipId;
          revenueData.pricePT = member.tblUser.agreePromo
            ? paketPT.totalPrice
            : paketPT.tblPackageMembership.price;
          revenueData.timesPT = paketPT.tblPackageMembership.times;
        }

        if (paketPG) {
          data.PG_Session = !member.PG_Session ? 1 : member.PG_Session + 1;
        }

        if (paketLeave) {
          data.leaveStatus = "PAID";
        }

        // CREATE REVENUE DATA
        if (paketMember || paketPT) {
          revenueData.keterangan = salesInvoice;
          await tblRevenue.create(revenueData);
          await tblUser.update(
            { flagActive: true, agreePromo: false },
            { where: { userId: member.userId } }
          );
        }
        // UPDATE DATA SETELAH PEMBAYARAN
        await tblMember.update(data, {
          where: { memberId: transaction.memberId },
        });

        // for classPackage checkout
        if (paketKelas) {
          let classPackage = await tblPackageClasses.create({
            expiredDate: createDateAsUTC(
              new Date(
                new Date().getFullYear(),
                new Date().getMonth(),
                new Date().getDate() +
                  (paketKelas.tblPackageMembership.times || 0)
              )
            ),
            memberId: member.memberId,
            subCategoryMembershipId:
              paketKelas.tblPackageMembership.subCategoryMembershipId,
            classSession: paketKelas.tblPackageMembership.classUsed,
            activeDate: createDateAsUTC(new Date()),
          });
          await tblRevenue.create({
            memberId: member.memberId,
            keterangan: salesInvoice,
            dateActiveMembership: createDateAsUTC(new Date()),
            activeMembershipExpired: classPackage.expiredDate,
            status: "OPEN",
            packageBefore: paketKelas.tblPackageMembership.package,
            times: paketKelas.tblPackageMembership.classUsed,
            kredit: 0,
            price: paketKelas.tblPackageMembership.price,
          });
        }

        let transactionUpdate = {
          salesInvoice: salesInvoice,
          status: "paid",
          keterangan: paketMember
            ? paketMember.tblPackageMembership.packageMembershipId
            : paketPT
            ? paketPT.tblPackageMembership.packageMembershipId
            : paketLeave
            ? paketLeave.tblPackageMembership.packageMembershipId
            : paketMember && paketPT
            ? `${paketMember.tblPackageMembership.packageMembershipId} + ${paketPT.tblPackageMembership.packageMembershipId}`
            : null,
          paymentDate: createDateAsUTC(new Date()),
          staffId: 1,
          deniedReason: null,
        };

        await tblTransaction.update(transactionUpdate, {
          where: { transactionId: transaction.transactionId },
        });

        await tblOrderList.update(
          { salesInvoice },
          { where: { transactionId: transaction.transactionId } }
        );

        // let orderList = await tblOrderList.findAll({
        //   where: {
        //     transactionId: transaction.transactionId,
        //     categoryMembershipId: 6,
        //   },
        //   include: [{ model: tblPackageMemberships }],
        // });

        // orderList.length > 0 &&
        //   (await orderList.forEach(async (order) => {
        //     let before = await tblMemberClasses.findOne({
        //       where: {
        //         memberId: transaction.memberId,
        //         subCategoryMembershipId: order.tblPackageMembership.subCategoryMembershipId,
        //       },
        //     });

        //     let newData = {
        //       memberId: transaction.memberId,
        //       subCategoryMembershipId: order.tblPackageMembership.subCategoryMembershipId,
        //       times: before ? before.times + order.tblPackageMembership.times : order.tblPackageMembership.times,
        //       // expired
        //     };

        //     if (before) {
        //       await tblMemberClasses.update(newData, {
        //         where: { id: before.id },
        //       });
        //     } else await tblMemberClasses.create(newData);
        //   }));

        res.status(200).json({ Message: "Success Paid Member !" });

        let user = await tblUser.findByPk(member.userId);
        let order = "";

        await transaction.tblOrderLists.forEach((element) => {
          order =
            order +
            `<div style="display:flex;margin-left:30px;">
            <div style="width:350px;">
              <p style="margin:5px;margin-left: 0px;">${
                element.tblPackageMembership.package
              } ${element.tblPackageMembership.times} ${
              element.categoryMembershipId !== 2 ||
              element.categoryMembershipId !== 2
                ? "Hari"
                : "Sesi"
            }</p>
            </div>
            <div>
              <p style="margin:5px;margin-left: 0px;">Rp ${convertRupiah(
                element.totalPrice
              )}</p>
            </div>
          </div>`;
        });

        mailOptions.to = user.email;
        mailOptions.subject = "Terima kasih atas transaksi di Megafit";
        mailOptions.html = `
        <img src="http://209.97.175.174:3000/asset/img/pola-megafit_black.png" height="30" width="150" alt="logo-megafit" />
        <p style="font-size: 20px;margin-bottom: 5px;"><b>Terima kasih telah belanja di Megafit</b></p>
        <p style="margin:0px 0px 10px 0px;color:#91c640">Lebih sedikit kertas, lebih hijau! Pilihan Megarangers membuat dunia lebih baik.</p>
  
        <p style="margin:15px 0px;"><b>Berikut merupakan detil pembelian di Megafit pada tanggal ${getDate(
          new Date(transaction.createdAt)
        )}</b></p>
  
        <div id="table-order" style="margin-bottom: 20px;">
          <div style="background-color:#dcdcdc;padding:10px 30px;margin-top:20px;width:500px">
            <p style="margin:0px;"><b>Invoice No: ${salesInvoice}</b></p>
          </div>
          <p style="margin: 10px 0px 10px 30px;"><b>Paket dipilih</b></p>
  
          ${order}
  
          <div style="display:flex;margin-left:30px;">
            <div style="width:350px;">
              <p style="margin:5px;margin-left: 0px;">Admin Fee</p>
            </div>
            <div>
              <p style="margin:5px;margin-left: 0px;">Rp ${
                transaction.admPrice ? convertRupiah(transaction.admPrice) : 0
              }</p>
            </div>
          </div>
          <div style="border-top:1px solid #aaa;font-size:0;margin:8px 30px;width: 500px;"></div>
          <div style="display:flex;margin-left:30px;">
            <div style="width:350px;">
              <p style="margin:5px;margin-left: 0px;">Total</p>
            </div>
            <div>
              <p style="margin:5px;margin-left: 0px;">Rp ${convertRupiah(
                transaction.amount
              )}</p>
            </div>
          </div>
        </div>
  
        <div style="border-top:1px solid #aaa;font-size:0;margin:8px auto;"></div>
        <div style="text-align:center;font-size: small;">
          <b>Email ini dibuat secara otomatis. Mohon tidak mengirim balasan ke email ini.</b>
        </div>
        <div style="border-top:1px solid #aaa;font-size:0;margin:8px auto;"></div>
        <p style="font-size: x-small;">* Transaksi sukses tidak bisa dibatalkan dan uang yang telah dibayarkan tidak bisa dikembalikan.</p>
        <p style="font-size: x-small;">* Email ini dikirimkan ke ${
          mailOptions.to
        } karena kamu telah memilih untuk menerima salinan tanda terima elektronik.</p>
  
        ${footerMail}
        `;

        await transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log("GAGAL");
            console.log(error);
          } else {
            console.log(mailOptions.to);
            console.log("Berhasil");
          }
        });

        await rememberExtendPackage(transaction.memberId);
      } else res.status(403).send();
    } catch (error) {
      if (error.name === "notFound") {
        let data = {
          status: "cancelled",
          deniedReason: "Dibatalkan otomatis oleh sistem.",
          expiredAt: null,
        };
        await tblTransaction.update(data, {
          where: { transactionId: +req.body.external_id || -1 },
        });
        res.status(404).json({ message: "Data Not Found" });
      } else if (error.name === "ok") {
        res.status(200).end();
      } else {
        next(error);
      }
    }
  }

  static async remove(req, res, next) {
    try {
      let cart = await tblOrderList.findOne({
        where: { id: req.params.id },
        include: { model: tblTransaction },
      });

      await tblOrderList.destroy({ where: { id: req.params.id } });
      let transaction = await tblTransaction.findOne({
        where: { transactionId: cart.tblTransaction.transactionId },
        include: { model: tblOrderList },
      });
      if (transaction.tblOrderLists.length > 0) {
        let update = {
          amount: cart.tblTransaction.amount - cart.totalPrice,
        };
        await tblTransaction.update(update, {
          where: { transactionId: cart.tblTransaction.transactionId },
        });
      } else {
        await tblTransaction.destroy({
          where: { transactionId: cart.tblTransaction.transactionId },
        });
        await tblHistoryPromo.destroy({
          where: { transaction: cart.tblTransaction.transactionId },
        });
      }

      if (cart.categoryMembershipId === 4) {
        await tblMember.update(
          { isLeave: null, leaveDate: null, leaveStatus: null },
          { where: { memberId: transaction.memberId } }
        );
      }

      res.status(200).json({ Message: "Succesfully Deleted" });
    } catch (error) {
      next(error);
    }
  }

  static async emailResi(req, res, next) {
    try {
      let cart = await tblOrderList.findAll({
        where: { salesInvoice: req.body.salesInvoice },
        include: [{ model: tblPackageMemberships }],
      });

      let transaction = await tblTransaction.findOne({
        where: { salesInvoice: req.body.salesInvoice },
      });

      let order = "";
      await cart.forEach((element) => {
        order =
          order +
          `<div style="display:flex;margin-left:30px;">
			    <div style="width:350px;">
			      <p style="margin:5px;margin-left: 0px;">${
              element.tblPackageMembership.package
            } ${element.tblPackageMembership.times} ${
            element.categoryMembershipId !== 2 ||
            element.categoryMembershipId !== 2
              ? "Hari"
              : "Sesi"
          }</p>
			    </div>
			    <div>
			      <p style="margin:5px;margin-left: 0px;">Rp ${convertRupiah(
              element.totalPrice
            )}</p>
			    </div>
			  </div>`;
      });

      mailOptions.to = req.body.email;
      mailOptions.subject = "Terima kasih atas transaksi di Megafit";
      mailOptions.html = `
			<img src="http://209.97.175.174:3000/asset/img/pola-megafit_black.png" height="30" width="150" alt="logo-megafit" />
			<p style="font-size: 20px;margin-bottom: 5px;"><b>Terima kasih telah belanja di Megafit</b></p>
			<p style="margin:0px 0px 10px 0px;color:#91c640">Lebih sedikit kertas, lebih hijau! Pilihan Megarangers membuat dunia lebih baik.</p>

			<p style="margin:15px 0px;"><b>Berikut merupakan detil pembelian di Megafit pada tanggal ${getDate(
        new Date(transaction.createdAt)
      )}</b></p>

			<div id="table-order" style="margin-bottom: 20px;">
			  <div style="background-color:#dcdcdc;padding:10px 30px;margin-top:20px;width:500px">
			    <p style="margin:0px;"><b>Invoice No: ${req.body.salesInvoice}</b></p>
			  </div>
			  <p style="margin: 10px 0px 10px 30px;"><b>Paket dipilih</b></p>

			  ${order}

			  <div style="display:flex;margin-left:30px;">
			    <div style="width:350px;">
			      <p style="margin:5px;margin-left: 0px;">Admin Fee</p>
			    </div>
			    <div>
			      <p style="margin:5px;margin-left: 0px;">Rp ${
              transaction.admPrice ? convertRupiah(transaction.admPrice) : 0
            }</p>
			    </div>
			  </div>
			  <div style="border-top:1px solid #aaa;font-size:0;margin:8px 30px;width: 500px;"></div>
			  <div style="display:flex;margin-left:30px;">
			    <div style="width:350px;">
			      <p style="margin:5px;margin-left: 0px;">Total</p>
			    </div>
			    <div>
			      <p style="margin:5px;margin-left: 0px;">Rp ${convertRupiah(
              transaction.amount
            )}</p>
			    </div>
			  </div>
			</div>

			<div style="border-top:1px solid #aaa;font-size:0;margin:8px auto;"></div>
			<div style="text-align:center;font-size: small;">
			  <b>Email ini dibuat secara otomatis. Mohon tidak mengirim balasan ke email ini.</b>
			</div>
			<div style="border-top:1px solid #aaa;font-size:0;margin:8px auto;"></div>
			<p style="font-size: x-small;">* Transaksi sukses tidak bisa dibatalkan dan uang yang telah dibayarkan tidak bisa dikembalikan.</p>
			<p style="font-size: x-small;">* Email ini dikirimkan ke ${
        mailOptions.to
      } karena kamu telah memilih untuk menerima salinan tanda terima elektronik.</p>

			${footerMail}
			`;

      transporter.sendMail(mailOptions, function (error) {
        if (error) {
          console.log("GAGAL");
          console.log(error);
        } else {
          console.log(mailOptions.to);
          console.log("Berhasil");
        }
      });
      res.status(200).json({ Message: "Email Resi Telah Terkirim !" });
    } catch (error) {
      next(error);
    }
  }

  static async check(req, res, next) {
    try {
      let transaction;
      if (req.query.lasted === "true") {
        transaction = await tblTransaction.findOne({
          where: {
            memberId: req.params.id,
            [Op.or]: [{ status: "unpaid" }],
          },
          include: [
            {
              model: tblOrderList,
              include: [{ model: tblPackageMemberships }],
            },
          ],
        });
      } else {
        transaction = await tblTransaction.findOne({
          where: {
            memberId: req.params.id,
            [Op.or]: [{ status: "unpaid" }, { status: "transferred" }],
          },
          include: [
            { model: tblOrderList, where: { categoryMembershipId: 4 } },
          ],
        });
      }

      res.status(200).json({ message: "Success", data: transaction });
    } catch (err) {
      next(err);
    }
  }
}

function convertRupiah(args) {
  let separator;
  var number_string = args.toString(),
    sisa = number_string.length % 3,
    rupiah = number_string.substr(0, sisa),
    ribuan = number_string.substr(sisa).match(/\d{3}/g);

  if (ribuan) {
    separator = sisa ? "." : "";
    rupiah += separator + ribuan.join(".");
  }

  return rupiah;
}

function getDate(args) {
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  return `${args.getDate()} ${months[args.getMonth()]} ${args.getFullYear()}`;
}

function cekSisaHari(args) {
  if (!args) return -30;

  let a = moment().format("YYYY-MM-DD");
  let b = moment(args, "YYYY-MM-DD");

  return b.diff(a, "days");
}

function cekSisaCuti(args, args2) {
  let a = moment(args2, "YYYY-MM-DD");
  let b = moment(args, "YYYY-MM-DD");

  return b.diff(a, "days");
}

module.exports = TransactionController;
