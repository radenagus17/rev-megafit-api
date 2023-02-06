const {
  tblUser,
  tblStaff,
  tblMember,
  tblPackageMemberships,
  tblDataSizeMember,
  tblRole,
  tblFoodTracking,
  tblTaskPT,
  tblCheckinCheckouts,
  tblSubCategoryMembership,
  tblRevenue,
  tblCategoryMembership,
  tblMemberClasses,
} = require("../models");

const { compare, hashPass } = require("../helpers/bcrypt");
const { sign } = require("../helpers/jsonwebtoken");
const Op = require("sequelize").Op;
const moment = require("moment");
const QRCode = require("qrcode");
const excelToJson = require("convert-excel-to-json");
const { createDateAsUTC } = require("../helpers/convertDate");
const { mailOptions, transporter, footerMail, baseUrlServer } = require("../helpers/nodemailer");

class usersController {
  static async signin(req, res, next) {
    const { username, password } = req.body;
    try {
      if (!username || !password) throw { name: "badRequest" };
      const userLogin = await tblUser.findOne({
        where: {
          username,
        },
        include: [
          { model: tblStaff, as: "staff" },
          {
            model: tblMember,
            include: [
              {
                model: tblMemberClasses,
                include: { model: tblSubCategoryMembership },
              },
              {
                model: tblStaff,
              },
            ],
          },
        ],
      });
      if (!userLogin) throw { name: "unauthorized" };
      const pass = compare(password, userLogin.password);
      if (!pass) throw { name: "unauthorized" };
      const token = sign({ userId: userLogin.userId, email: userLogin.email });

      res.status(200).json({
        token,
        nickname: userLogin.nickname,
        fullname: userLogin.fullname,
        userId: userLogin.userId,
        roleId: userLogin.roleId,
        hasConfirmTermAndCondition: userLogin.tblMember ? userLogin.tblMember.hasConfirmTermAndCondition : null,
        hasSeenSdkFreeze: userLogin.tblMember ? userLogin.tblMember.hasSeenSdkFreeze : null,
        isFreeze: userLogin.tblMember ? userLogin.tblMember.isFreeze : null,
        freezeDate: userLogin.tblMember ? userLogin.tblMember.freezeDate : null,
        memberId: userLogin.tblMember ? userLogin.tblMember.memberId : null,
        packageId: userLogin.tblMember ? userLogin.tblMember.packageMembershipId : null,
        activeExpired: userLogin.tblMember ? userLogin.tblMember.activeExpired : null,
        canPTOnline: userLogin.tblStaff ? userLogin.tblStaff.canPTOnline : null,
        memberClasses: userLogin.tblMember ? userLogin.tblMember.tblMemberClasses : null,
        ptId: userLogin.tblMember?.tblStaff?.userId || null,
      });
    } catch (error) {
      console.log(error)
      next(error);
    }
  }

  static async signup(req, res, next) {
    const {
      username,
      password,
      fullname,
      nickname,
      noKtp,
      dateOfBirth,
      email,
      gender,
      igAccount,
      roleId,
      haveWhatsapp,
      activeExpired,
      phone,
      isPermanent,
      available,
      NIK,
      canPTOnline,
      evaluatorId1,
      evaluatorId2,
      ptId,
      ptSessionOnline,
      memberId,
      hasSeenSdkFreeze,
      isFreeze,
    } = req.body;
    try {
      let findNew;

      let newUser = {
        username,
        password: hashPass(password),
        fullname: capitalize(fullname),
        nickname: capitalize(nickname),
        noKtp,
        avatar: req.file ? req.file.path : `/uploads/icon_user.png`,
        dateOfBirth,
        email,
        gender,
        igAccount,
        roleId,
        haveWhatsapp,
        flagActive: activeExpired === "null" || !activeExpired ? false : new Date(activeExpired) < new Date() ? false : true,
      };
      if (Number(phone[0]) === 0) {
        newUser.phone = "62" + phone.slice(1, phone.length);
      } else if (Number(phone[0]) === 8) {
        newUser.phone = "62" + phone;
      } else if (Number(phone.slice(0, 2)) === 62) {
        newUser.phone = phone;
      }

      const checkingUser = await tblUser.findOne({
        where: {
          [Op.or]: [{ email }, { username }, { phone }, { noKtp }],
        },
      });

      if (checkingUser) throw { name: "unauthorized" };

      let createUser = await tblUser.create(newUser);

      if (Number(roleId) !== 2) {
        let createStaff, updateStaff;

        let newStaff = {
          userId: createUser.null,
          isPermanent: isPermanent ? isPermanent : true,
          available: available ? available : true,
          NIK,
          canPTOnline: canPTOnline || false,
          evaluatorId1: evaluatorId1 === "null" || !evaluatorId1 ? null : evaluatorId1,
          evaluatorId2: evaluatorId2 === "null" || !evaluatorId2 ? null : evaluatorId2,
        };

        if (createUser) createStaff = await tblStaff.create(newStaff);

        let nameImageCard = createStaff.null;
        await QRCode.toFile(`./qr/${nameImageCard}.png`, `${nameImageCard}`, {
          color: {
            dark: "#000",
            light: "#FFF", //background
          },
        });

        if (createStaff)
          updateStaff = await tblStaff.update(
            { cardImage: `/qr/${nameImageCard}.png` },
            {
              where: {
                userId: createStaff.userId,
              },
            }
          );

        if (updateStaff)
          findNew = await tblUser.findByPk(createStaff.userId, {
            include: [{ model: tblStaff, as: "staff" }],
          });
      } else {
        let lastIdNumber = await tblMember.findAll({
          order: [["memberId", "DESC"]],
        });

        let createMember, updateMember;
        let newMember = {
          memberId: lastIdNumber[0].memberId < 2000 ? 2000 : lastIdNumber[0].memberId + 1,
          userId: createUser.null,
          cardImage: "",
          activeExpired: activeExpired === "null" || !activeExpired ? null : createDateAsUTC(new Date(activeExpired)),
          ptId: ptId === "null" || ptId === "" ? null : ptId,
          ptSessionOnline: ptSessionOnline || 0,
        };
        if (memberId) newMember.memberId = memberId;
        if (hasSeenSdkFreeze) newMember.hasSeenSdkFreeze = hasSeenSdkFreeze;
        if (isFreeze) newMember.isFreeze = isFreeze;

        if (createUser) createMember = await tblMember.create(newMember);

        let nameImageCard = createMember.null;
        await QRCode.toFile(`./qr/${nameImageCard}.png`, `${nameImageCard}`, {
          color: {
            dark: "#000",
            light: "#FFF", //background
          },
        });
        if (createMember) updateMember = await tblMember.update({ cardImage: `/qr/${nameImageCard}.png` }, { where: { userId: createMember.userId } });

        if (updateMember)
          findNew = await tblUser.findByPk(createMember.userId, {
            include: [
              {
                model: tblMember,
                include: [
                  { model: tblPackageMemberships, as: "packageMembership" },
                  { model: tblPackageMemberships, as: "packagePT" },
                ],
              },
            ],
          });
      }
      if (findNew) res.status(201).json({ message: "Success", data: findNew });

      mailOptions.to = email;
      mailOptions.subject = "Selamat bergabung di Megafit";
      mailOptions.html = `
			<img src="${baseUrlServer}/asset/img/pola-megafit_black.png" height="30" width="200" alt="logo-megafit" />
				<p style="font-size: 20px; margin-bottom: 10px;"><b>Hai ${nickname}!</b></p>
				<p style="margin:10px 0px;">Terima kasih telah melakukan pendaftaran di <a href="http://megafit.co.id"> megafit.co.id</a></p>
				
				<p style="margin:10px 0px 10px 5px;">Berikut Username dan Password anda:</p>
				<p style="margin:10px 0px 5px 5px;">Username: ${username}</p>
				<p style="margin:5px 0px 10px 5px;">Password: ${password}</p>
				
				<p style="margin:10px 0px 20px 5px;">Ayo segera login dan buat reservasi untuk memulai perjalanan hidup sehat anda</p>

				<div style="border-top:1px solid #aaa;font-size:0;margin:8px auto;"></div>
				<div style="text-align:center;font-size: small;">
				<b>Email ini dibuat secara otomatis. Mohon tidak mengirim balasan ke email ini.</b>
				</div>
				<div style="border-top:1px solid #aaa;font-size:0;margin:8px auto;"></div>
				
				${footerMail}
				`;

      await transporter.sendMail(mailOptions, function (error) {
        if (error) {
          console.log("GAGAL");
          console.log(error);
          res.status(400).json({ message: "failed" });
        } else {
          res.status(200).json({ message: "success" });
          console.log("Berhasil");
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async homeTrial(req, res, next) {
    const { email, phone, fullname, member } = req.body;

    try {
      let newUser = {
        username: email,
        password: hashPass(phone),
        fullname: capitalize(fullname),
        nickname: fullname.split(" ")[0],
        email: email,
        phone: phone,
        roleId: 2,
        avatar: `/uploads/icon_user.png`,
        first_login: true,
      };

      if (Number(phone[0]) === 0) {
        newUser.phone = "62" + phone.slice(1, phone.length);
      } else if (Number(phone[0]) === 8) {
        newUser.phone = "62" + phone;
      } else if (Number(phone.slice(0, 2)) === 62) {
        newUser.phone = phone;
      }

      const checkingUser = await tblUser.findOne({
        where: {
          [Op.or]: [{ email }, { phone: Number(phone[0]) === 0 ? `62${phone.slice(1, phone.length)}` : Number(phone.slice(0, 2)) === 62 ? phone : phone }],
        },
      });

      if (checkingUser) throw { name: "emailFound" };

      let createUser = await tblUser.create(newUser);
      let lastIdNumber = await tblMember.findAll({
        order: [["memberId", "DESC"]],
      });

      await QRCode.toFile(`./qr/${lastIdNumber[0].memberId + 1}.png`, `${lastIdNumber[0].memberId + 1}`, {
        color: {
          dark: "#000",
          light: "#FFF", //backround
        },
      });

      let newMember = {
        memberId: lastIdNumber[0].memberId + 1,
        cardImage: `/qr/${lastIdNumber[0].memberId + 1}.png`,
        userId: createUser.null,
        activeExpired: createDateAsUTC(new Date(moment().add(1, "days"))),
        packageMembershipId: "Trial",
        hasSeenSdkFreeze: true,
        invited_by: member,
      };

      await tblMember.create(newMember);

      let responseData = {
        userId: createUser.null,
        roleId: 2,
        fullname: capitalize(fullname),
        nickname: fullname.split(" ")[0],
        hasConfirmTermAndCondition: false,
        hasSeenSdkFreeze: true,
        isFreeze: false,
        freezeDate: null,
        activeExpired: newMember.activeExpired,
        packageId: newMember.packageMembershipId,
        memberId: newMember.memberId,
        canPTOnline: null,
        staffId: null,
        dataMemberClasses: null,
      };

      let token = sign({ userId: createUser.null });
      res.status(201).json({ message: "Success", data: responseData, token });

      mailOptions.to = email;
      mailOptions.subject = "Selamat bergabung di Megafit";
      mailOptions.html = `
			<img src="${baseUrlServer}/asset/img/pola-megafit_black.png" height="30" width="200" alt="logo-megafit" />
				<p style="font-size: 20px; margin-bottom: 10px;"><b>Hai ${newUser.nickname}!</b></p>
				<p style="margin:10px 0px;">Terima kasih telah melakukan pendaftaran di <a href="http://megafit.co.id"> megafit.co.id</a></p>
				
				<p style="margin:10px 0px 10px 5px;">Berikut Username dan Password anda:</p>
				<p style="margin:10px 0px 5px 5px;">Username: ${email}</p>
				<p style="margin:5px 0px 10px 5px;">Password: ${phone}</p>
				
				<p style="margin:10px 0px 20px 5px;">Ayo segera login dan buat reservasi untuk memulai perjalanan hidup sehat anda</p>

				<div style="border-top:1px solid #aaa;font-size:0;margin:8px auto;"></div>
				<div style="text-align:center;font-size: small;">
				<b>Email ini dibuat secara otomatis. Mohon tidak mengirim balasan ke email ini.</b>
				</div>
				<div style="border-top:1px solid #aaa;font-size:0;margin:8px auto;"></div>
				
				${footerMail}
				`;

      await transporter.sendMail(mailOptions, function (error) {
        if (error) {
          console.log("GAGAL");
          console.log(error);
          res.status(400).json({ message: "failed" });
        } else {
          res.status(200).json({ message: "success" });
          console.log("Berhasil");
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async inviteMember(req, res, next) {
    const { phone, member } = req.body;

    try {
      let newUser = {
        username: phone,
        password: hashPass(phone),
        email: phone,
        phone: phone,
        roleId: 2,
        avatar: `/uploads/icon_user.png`,
        first_login: true,
      };

      if (Number(phone[0]) === 0) {
        newUser.phone = "62" + phone.slice(1, phone.length);
      } else if (Number(phone[0]) === 8) {
        newUser.phone = "62" + phone;
      } else if (Number(phone.slice(0, 2)) === 62) {
        newUser.phone = phone;
      }

      const checkingUser = await tblUser.findOne({
        where: {
          phone: Number(phone[0]) === 0 ? `62${phone.slice(1, phone.length)}` : Number(phone.slice(0, 2)) === 62 ? phone : phone,
        },
      });

      if (checkingUser) throw { name: "phoneFound" };

      let createUser = await tblUser.create(newUser);
      let lastIDMember = await tblMember.findAll({
        order: [["memberId", "DESC"]],
      });

      await QRCode.toFile(`./qr/${lastIDMember[0].memberId + 1}.png`, `${lastIDMember[0].memberId + 1}`, {
        color: {
          dark: "#000",
          light: "#FFF", //background
        },
      });

      let newMember = {
        memberId: lastIDMember[0].memberId + 1,
        cardImage: `/qr/${lastIDMember[0].memberId + 1}.png`,
        userId: createUser.null,
        activeExpired: createDateAsUTC(new Date(moment().add(1, "days"))),
        packageMembershipId: "Trial",
        hasSeenSdkFreeze: true,
        invited_by: member,
      };

      let createMember = await tblMember.create(newMember);

      res.status(201).json({ message: "Success", data: createMember });
    } catch (error) {
      next(error);
    }
  }

  static async generateQR(req, res, next) {
    const { memberId } = req.body;
    try {
      let nameImageCard = memberId;
      await QRCode.toFile(`./qr/${memberId}.png`, `${nameImageCard}`, {
        color: {
          dark: "#000",
          light: "#FFF", //background
        },
      });

      await tblMember.update({ cardImage: `/qr/${nameImageCard}.png` }, { where: { memberId } });
      res.status(200).json({ Message: "QR Code Has Been Generated." });
    } catch (error) {
      next(error);
    }
  }

  static async updateDataMember(req, res, next) {
    try {
      let member = await tblMember.findOne({ where: { userId: req.params.id } });

      let oldData = await tblDataSizeMember.findOne({
        where: { memberId: member.memberId },
        order: [["id", "DESC"]],
      });

      let newData = {
        umur: Number(req.body.umur) !== 0 ? req.body.umur : oldData && oldData.umur ? oldData.umur : 0,
        height: Number(req.body.height) !== 0 ? req.body.height : oldData && oldData.height ? oldData.height : 0,
        weight: Number(req.body.weight) !== 0 ? req.body.weight : oldData && oldData.weight ? oldData.weight : 0,
        triceps: Number(req.body.triceps) !== 0 ? req.body.triceps : oldData && oldData.triceps ? oldData.triceps : 0,
        dada: Number(req.body.dada) !== 0 ? req.body.dada : oldData && oldData.dada ? oldData.dada : 0,
        perut: Number(req.body.perut) !== 0 ? req.body.perut : oldData && oldData.perut ? oldData.perut : 0,
        pinggul: Number(req.body.pinggul) !== 0 ? req.body.pinggul : oldData && oldData.pinggul ? oldData.pinggul : 0,
        pinggang: Number(req.body.pinggang) !== 0 ? req.body.pinggang : oldData && oldData.pinggang ? oldData.pinggang : 0,
        paha: Number(req.body.paha) !== 0 ? req.body.paha : oldData && oldData.paha ? oldData.paha : 0,
        targetWeight: +req.body.targetWeight !== 0 ? +req.body.targetWeight : oldData && oldData.targetWeight ? oldData.targetWeight : 0,
        targetTriceps: +req.body.targetTriceps !== 0 ? +req.body.targetTriceps : oldData && oldData.targetTriceps ? oldData.targetTriceps : 0,
        targetDada: +req.body.targetDada !== 0 ? +req.body.targetDada : oldData && oldData.targetDada ? oldData.targetDada : 0,
        targetPerut: +req.body.targetPerut !== 0 ? +req.body.targetPerut : oldData && oldData.targetPerut ? oldData.targetPerut : 0,
        targetPinggul: +req.body.targetPinggul !== 0 ? +req.body.targetPinggul : oldData && oldData.targetPinggul ? oldData.targetPinggul : 0,
        targetPinggang: +req.body.targetPinggang !== 0 ? +req.body.targetPinggang : oldData && oldData.targetPinggang ? oldData.targetPinggang : 0,
        targetPaha: +req.body.targetPaha !== 0 ? +req.body.targetPaha : oldData && oldData.targetPaha ? oldData.targetPaha : 0,
        memberId: member.memberId,
      };

      await tblDataSizeMember.create(newData);

      let dataReturn = await tblUser.findByPk(req.params.id, {
        include: [
          {
            model: tblMember,
            include: [
              {
                model: tblDataSizeMember,
                order: [["createAt", "DESC"]],
              },
            ],
          },
        ],
      });

      res.status(200).json({ message: "Success", data: dataReturn });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  static async firstLogin(req, res, next) {
    const { email, fullname, nickname, gender, date } = req.body;

    try {
      let checkDataExist = await tblUser.findAll({
        where: {
          email,
          userId: { [Op.not]: req.params.id },
        },
      });

      if (checkDataExist.length) throw { name: "emailFound" };
      let data = {
        email,
        fullname,
        nickname,
        gender,
        dateOfBirth: createDateAsUTC(new Date(date)),
        first_login: false,
      };

      await tblUser.update(data, {
        where: { userId: req.params.id },
      });

      res.status(200).json({ message: "Success", data: data });
    } catch (error) {
      next(error);
    }
  }

  static async forgetPassword(req, res, next) {
    try {
      const user = await tblUser.findOne({ where: { email: req.query.email } });
      if (!user) throw { name: "userNotFound" };
      const token = sign({ userId: user.userId });
      mailOptions.to = user.email;
      mailOptions.subject = "Reset password Megafit";
      mailOptions.html = `
      <img src="${baseUrlServer}/asset/img/pola-megafit_black.png" height="30" width="150" alt="logo-megafit" />
      <p style="font-size: 20px;"><b>Hai ${user.nickname}</b></p>
      <p style="margin:10px 0px;">Kami baru saja menerima permintaan untuk mengganti password.</p>
      <p style="margin:10px 0px;">Silahkan klik link di bawah dan ikuti petunjuk untuk mengganti password Anda.</p>
      <img src="${baseUrlServer}/asset/img/forget_password_1.png" height="150" width="150" alt="logo-forget" />
      <br />
      <p><b>Username : ${user.username}</b></p>
      <div style="border-radius: 2px;background-color:#91c640;width:128px;">
        <a href="${baseUrlClient}/reset-password/${token}" target="_blank" style="padding: 8px 12px; border: 1px solid #91c640;border-radius: 2px;color: #ffffff;text-decoration: none;font-weight:bold;display: inline-block;">
          Reset Password             
        </a>
      </div>
    
      <p style="margin:10px 0px;">Jika permintaan penggantian password ini bukan dari Anda, atau jika Anda merasa akun
      Anda sedang diretas, silahkan laporkan ke info@megafit.co.id</p>
      
      <div style="border-top:1px solid #aaa;font-size:0;margin:8px auto;"></div>
      <div style="text-align:center;font-size: small;">
      <b>Email ini dibuat secara otomatis. Mohon tidak mengirim balasan ke email ini.</b>
      </div>
      <div style="border-top:1px solid #aaa;font-size:0;margin:8px auto;"></div>
      
      ${footerMail}
      `;

      transporter.sendMail(mailOptions, function (error) {
        if (error) {
          console.log("GAGAL");
          console.log(error);
          res.status(400).json({ message: "failed" });
        } else {
          res.status(200).json({ message: "success" });
          console.log("Berhasil");
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async check(req, res, next) {
    try {
      let checkEmail, checkHp, checkUsername, checkMemberId, checkKtp;
      if (req.query.email) {
        if (req.query.userId) {
          checkEmail = await tblUser.findOne({
            where: { email: req.query.email, userId: req.query.userId },
          });
        } else {
          checkEmail = await tblUser.findOne({
            where: { email: req.query.email },
          });
        }
      }
      if (req.query.hp) {
        let phone;
        if (Number(req.query.hp[0]) === 0) {
          phone = "62" + req.query.hp.slice(1, req.query.hp.length);
        } else if (Number(req.query.hp.slice(0, 2)) === 62) {
          phone = req.query.hp;
        } else {
          phone = "62" + req.query.hp;
        }
        if (req.query.userId) {
          checkHp = await tblUser.findOne({
            where: { phone, userId: req.query.userId },
          });
        } else {
          checkHp = await tblUser.findOne({ where: { phone } });
        }
      }
      if (req.query.username) {
        if (req.query.userId) {
          checkUsername = await tblUser.findOne({
            where: { username: req.query.username, userId: req.query.userId },
          });
        } else {
          checkUsername = await tblUser.findOne({
            where: { username: req.query.username },
          });
        }
      }
      if (req.query.memberId) {
        checkMemberId = await tblMember.findByPk(req.query.memberId);
      }
      if (req.query.ktp) {
        if (req.query.userId) {
          checkKtp = await tblUser.findOne({
            where: { noKtp: req.query.ktp, userId: req.query.userId },
          });
        } else {
          checkKtp = await tblUser.findOne({ where: { noKtp: req.query.ktp } });
        }
      }

      res.status(200).json({
        emailAvailable: checkEmail ? false : true,
        hpAvailable: checkHp ? false : true,
        usernameAvailable: checkUsername ? false : true,
        memberIdAvailable: checkMemberId ? false : true,
        ktpAvailable: checkKtp ? false : true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async findAll(req, res, next) {
    try {
      let data;
      if (req.query.only === "member") {
        data = await tblUser.findAll({
          include: [
            {
              required: true,
              model: tblMember,
            },
          ],
          raw: true,
          nest: true,
        });

        await data.forEach((x) => {
          x.sisaHariMembership = cekSisaHari(x.tblMember.activeExpired);
          x.sisaHariMembershipConverted =
            x.tblMember.isFreeze && x.tblMember.activeDate && !x.tblMember.isLeave
              ? `${cekSisaHari(x.tblMember.activeExpired, x.tblMember.freezeDate)} Hari`
              : (x.tblMember.activeDate && x.tblMember.leaveDate && new Date(x.tblMember.leaveDate) > new Date()) || (x.tblMember.activeDate && x.tblMember.leaveDate && x.tblMember.isLeave)
              ? `${cekSisaHari(x.tblMember.activeExpired, x.tblMember.leaveDate) - 30} Hari`
              : cekSisaHari(x.tblMember.activeExpired) <= 0 || !x.tblMember.activeExpired
              ? `0 Hari`
              : `${cekSisaHari(x.tblMember.activeExpired)} Hari`;
          x.status = x.tblMember.isFreeze
            ? "BEKU"
            : x.tblMember.activeDate && x.tblMember.isLeave && x.tblMember.leaveDate && !x.tblMember.isFreeze
            ? "CUTI"
            : !x.tblMember.activeDate && !x.tblMember.isFreeze && x.tblMember.activeExpired
            ? "BELUM AKTIF"
            : x.tblMember.activeDate && x.sisaHariMembership > 0 && !x.tblMember.isFreeze && !x.tblMember.isLeave
            ? "AKTIF"
            : x.tblMember.activeDate && x.sisaHariMembership > -7 && x.sisaHariMembership <= 0 && !x.tblMember.isFreeze && !x.tblMember.isLeave
            ? "TENGGANG"
            : !x.tblMember.activeExpired && !x.tblMember.activeDate && !x.tblMember.packageMembershipId
            ? "LEADS"
            : "BERHENTI";

          x.joinDate = moment(new Date(x.tblMember.createdAt)).format("DD MMM YYYY");
          x.activeExpired = !x.tblMember.activeExpired ? "-" : moment(new Date(x.tblMember.activeExpired)).format("DD MMM YYYY");
          x.activeDate = !x.tblMember.activeDate ? "-" : moment(new Date(x.tblMember.activeDate)).format("DD MMM YYYY");
          x.lastCheckin = !x.tblMember.lastCheckin ? "-" : moment(new Date(x.tblMember.lastCheckin)).format("DD MMM YYYY");
          x.ptSession = x.tblMember.ptSession;
          x.ptSessionOnline = x.tblMember.ptSessionOnline;
          x.packageMembershipId = x.tblMember.packageMembershipId;
          x.freezeDate = !x.tblMember.freezeDate ? "-" : moment(new Date(x.tblMember.freezeDate)).format("DD MMM YYYY");
          x.unfreezeDate = !x.tblMember.unfreezeDate ? "-" : moment(new Date(x.tblMember.unfreezeDate)).format("DD MMM YYYY");
          x.leaveDate = !x.tblMember.leaveDate ? "-" : moment(new Date(x.tblMember.leaveDate)).format("DD MMM YYYY");
          x.isHealthy = x.tblMember.isHealthy === null ? "-" : !x.tblMember.isHealthy ? "FALSE" : "TRUE";
          x.healthExpiredAt = !x.tblMember.healthExpiredAt ? "-" : moment(new Date(x.tblMember.healthExpiredAt)).format("DD MMM YYYY");
          x.memberId = x.tblMember.memberId;
        });

        data = data.sort((a, b) => a.tblMember.memberId - b.tblMember.memberId);
      } else if (req.query.only === "member-pt") {
        data = await tblUser.findAll({
          include: [
            {
              required: true,
              model: tblMember,
              include: [{ model: tblDataSizeMember }, { model: tblTaskPT }, { model: tblFoodTracking }],
            },
            { model: tblRole },
          ],
        });
      } else if (req.query.only === "staff") {
        data = await tblUser.findAll({
          include: [{ required: true, model: tblStaff, as: "staff" }, { model: tblRole }],
        });
      } else if (req.query.only === "pt") {
        data = await tblUser.findAll({
          where: { roleId: 6 },
          include: [{ required: true, model: tblStaff, as: "staff" }, { model: tblRole }],
        });
      } else {
        data = await tblUser.findAll({
          include: [
            { model: tblStaff, as: "staff" },
            {
              model: tblMember,
              include: [
                { model: tblPackageMemberships, as: "packageMembership" },
                { model: tblPackageMemberships, as: "packagePT" },
              ],
            },
            { model: tblRole },
          ],
        });
      }
      if (data) res.status(200).json({ message: "Success", totalRecord: data.length, data });
    } catch (error) {
      next(error);
    }
  }

  static async findAllPT(req, res, next) {
    try {
      const data = await tblUser.findAll({
        where: { roleId: 6 },
        include: [{ required: true, model: tblStaff, as: "staff" }, { model: tblRole }],
      });

      res.status(200).json({ message: "Success", totalRecord: data.length, data });
    } catch (error) {
      next(error);
    }
  }

  static async findOne(req, res, next) {
    let lockerKey = null,
      checkId = null,
      dataMember = null,
      noBottle = null;
    try {
      if (req.query.idMember) {
        let detailMember = await tblUser.findOne({
          include: [
            {
              model: tblMember,
              where: { memberId: req.query.idMember },
              include: { model: tblPackageMemberships, as: "packageMembership" },
            },
          ],
        });
        if (detailMember) {
          if (new Date(detailMember.tblMember.activeExpired) < new Date()) {
            await tblUser.update({ flagActive: false }, { where: { userId: detailMember.userId } });

            detailMember.flagActive = 0;
          }

          let checkLockerkey = await tblCheckinCheckouts.findOne({
            where: { userId: detailMember.userId, lockerKey: { [Op.ne]: 0 } },
          });

          let checkNoBottle = await tblCheckinCheckouts.findOne({
            where: { userId: detailMember.userId, noBottle: { [Op.ne]: 0 } },
          });

          if (checkLockerkey != null) {
            lockerKey = checkLockerkey.lockerKey;
            checkId = checkLockerkey.checkId;
          }

          if (checkNoBottle != null) {
            noBottle = checkNoBottle.noBottle;
            checkId = checkNoBottle.checkId;
          }
          res.status(200).json({
            message: "Success",
            data: detailMember,
            lockerKey,
            checkId,
            noBottle,
          });
        } else {
          let detailUser = await tblUser.findByPk(req.params.id, {
            // where: { username: req.body.username },  bila nyari username juga
            include: [{ model: tblStaff, as: "staff" }, { model: tblMember }],
          });

          if (!detailUser) throw { name: "userNotFound" };
          if (detailUser.tblMember) {
            //cek sudah expired atau belum
            if (new Date(detailUser.tblMember.activeExpired) < new Date()) {
              await tblUser.update({ flagActive: false }, { where: { userId: detailUser.userId } });

              detailUser.flagActive = 0;
            }

            let checkLockerkey = await tblCheckinCheckouts.findOne({
              where: { userId: detailUser.userId, lockerKey: { [Op.ne]: 0 } },
            });

            if (checkLockerkey != null) {
              lockerKey = checkLockerkey.lockerKey;
              checkId = checkLockerkey.checkId;
            }
          }
          res.status(200).json({ message: "Success", data: detailUser, lockerKey, checkId });
        }
      } else {
        let detailUser = await tblUser.findByPk(req.params.id, {
          // where: { username: req.body.username },  bila nyari username juga
          include: [
            { model: tblStaff, as: "staff" },
            {
              model: tblMember,
              include: [{ model: tblDataSizeMember }, { model: tblStaff, include: [{ model: tblUser, as: "staff" }] }, { model: tblTaskPT }, tblFoodTracking],
            },
            { model: tblCheckinCheckouts, as: "member" },
          ],
        });

        if (detailUser) {
          //bila members

          if (detailUser.tblMember) {
            //cek sudah expired atau belum
            if (
              new Date(detailUser.tblMember.activeExpired).getFullYear() < new Date().getFullYear() ||
              (new Date(detailUser.tblMember.activeExpired).getMonth() < new Date().getMonth() && new Date(detailUser.tblMember.activeExpired).getFullYear() <= new Date().getFullYear()) ||
              (new Date(detailUser.tblMember.activeExpired).getDate() < new Date().getDate() &&
                new Date(detailUser.tblMember.activeExpired).getMonth() === new Date().getMonth() &&
                new Date(detailUser.tblMember.activeExpired).getFullYear() === new Date().getFullYear())
            ) {
              await tblUser.update({ flagActive: false }, { where: { userId: detailUser.userId } });

              detailUser.flagActive = 0;
            }

            let checkLockerkey = await tblCheckinCheckouts.findOne({
              where: {
                userId: detailUser.userId,
                [Op.or]: [{ lockerKey: { [Op.ne]: 0 } }, { noBottle: { [Op.ne]: 0 } }],
              },
            });

            if (checkLockerkey != null) {
              lockerKey = checkLockerkey.lockerKey;
              checkId = checkLockerkey.checkId;
              noBottle = checkLockerkey.noBottle;
            }

            dataMember = await tblDataSizeMember.findOne({
              where: { memberId: detailUser.tblMember.memberId },
              order: [["id", "DESC"]],
            });
          }
          if (detailUser.tblMember) {
            detailUser.member = detailUser.member.filter((el) => el.isReservation === true);
            res.status(200).json({
              message: "Success",
              data: detailUser,
              lockerKey,
              checkId,
              dataMember,
              noBottle,
            });
          } else {
            res.status(200).json({ message: "Success", data: detailUser });
          }
        }
      }
    } catch (error) {
      next(error);
    }
  }

  static async inActiveLeave(req, res, next) {
    try {
      let member = await tblMember.findByPk(req.params.id);
      let packageLeave = await tblSubCategoryMembership.findOne({
        include: [{ model: tblPackageMemberships }],
        where: { categoryMembershipId: 4 },
      });
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

      let selisihHari = cekSisaHari(new Date(), new Date(member.leaveDate));

      let newActiveExpired = new Date(new Date(member.activeExpired).setDate(new Date(member.activeExpired).getDate() - (packageLeave.tblPackageMemberships[0].times - selisihHari)));

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

      promises.push(
        tblMember.update(
          {
            activeExpired: createDateAsUTC(newActiveExpired),
            isLeave: null,
            leaveDate: null,
          },
          { where: { memberId: req.params.id } }
        )
      );

      await Promise.all(promises);
      res.status(200).json({ message: "Success" });
    } catch (error) {
      next(error);
    }
  }

  static async resetFormKesehatan(req, res, next) {
    try {
      await tblMember.update({ isHealthy: 1 }, { where: { memberId: req.params.id } });
      res.status(200).json({ message: "Success" });
    } catch (error) {
      next(error);
    }
  }

  static async checkToken(req, res, next) {
    try {
      let userLogin = await tblUser.findOne({
        where: { userId: req.user.userId },
        include: [
          {
            model: tblStaff,
            as: "staff",
          },
          tblMember,
        ],
      });

      res.status(200).json({
        nickname: userLogin.nickname,
        fullname: userLogin.fullname,
        userId: userLogin.userId,
        roleId: userLogin.roleId,
        hasConfirmTermAndCondition: userLogin.tblMember ? userLogin.tblMember.hasConfirmTermAndCondition : null,
        hasSeenSdkFreeze: userLogin.tblMember ? userLogin.tblMember.hasSeenSdkFreeze : null,
        isFreeze: userLogin.tblMember ? userLogin.tblMember.isFreeze : null,
        freezeDate: userLogin.tblMember ? userLogin.tblMember.freezeDate : null,
        memberId: userLogin.tblMember ? userLogin.tblMember.memberId : null,
        activeExpired: userLogin.tblMember ? userLogin.tblMember.activeExpired : null,
        packageId: userLogin.tblMember ? userLogin.tblMember.packageMembershipId : null,
        canPTOnline: userLogin.tblStaff ? userLogin.tblStaff.canPTOnline : null,
        staffId: userLogin.staff ? userLogin.staff.staffId : null,
        memberClasses: userLogin.tblMember ? userLogin.tblMember.tblMemberClasses : null,
        ptId: userLogin.tblMember?.tblStaff?.userId || null,
      });
    } catch (error) {
      next(error);
    }
  }

  static async importExcel(req, res, next) {
    let idMemberError = [],
      idStaffError = [];
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
              A: "idMember",
              B: "namaLengkap",
              C: "namaPanggilan",
              D: "username",
              E: "noKtp",
              F: "tanggalLahir",
              G: "email",
              H: "nomorHp",
              I: "kelamin",
              J: "akunIg",
              K: "adaWhatsapp",
              L: "tanggalAktifasiMember",
              M: "tanggalKadarluasaMember",
              N: "sesiPT",
              O: "sesiPTOnline",
              P: "paketMembership",
              Q: "status",
              R: "tanggalBeku",
              S: "ptId",
              T: "tanggalCuti",
              U: "paketPT",
            },
          },
          {
            name: "staff",
            header: {
              rows: 1,
            },
            columnToKey: {
              A: "idStaff",
              B: "namaLengkap",
              C: "namaPanggilan",
              D: "username",
              E: "noKtp",
              F: "tanggalLahir",
              G: "email",
              H: "nomorHp",
              I: "kelamin",
              J: "akunIg",
              K: "adaWhatsapp",
              L: "role",
              M: "jamMasuk",
            },
          },
          {
            name: "package",
            header: {
              rows: 1,
            },
            columnToKey: {
              A: "packageMembershipId",
              B: "package",
              C: "categoryMembership",
              D: "times",
              E: "price",
              F: "startPromo",
              G: "endPromo",
              H: "access",
              I: "adminFee",
              J: "activeMember",
              K: "sessionPtHours",
            },
          },
        ],
      });

      // Package
      if (data.package.length > 0) {
        let kategori = await tblCategoryMembership.findAll();

        await data.package.forEach(async (element) => {
          try {
            let newData = {
              packageMembershipId: element.packageMembershipId,
              package: element.package,
              times: element.times,
              price: element.price,
              startPromo: element.startPromo,
              endPromo: element.endPromo,
              access: element.access,
              adminFee: element.adminFee,
              activeMember: element.activeMember,
              flagActive: 1,
              sessionPtHours: element.sessionPtHours,
            };

            // categoryMembershipId: String(element.noKtp),
            let selectKategori;
            if (element.categoryMembership === String) {
              selectKategori = await kategori.find((el) => el.categoryMembership.toLowerCase() === element.categoryMembership.toLowerCase());
            } else {
              selectKategori = await kategori.find((el) => el.categoryMembership === element.categoryMembership);
            }

            if (selectKategori) {
              newData.categoryMembershipId = selectKategori.categoryMembershipId;
            } else {
              let createPackage = await tblCategoryMemberships.create({
                categoryMembership: element.categoryMembership,
              });

              newData.categoryMembershipId = createPackage.null;
            }

            await tblPackageMemberships.create(newData);
          } catch (error) {
            console.log(createDateAsUTC(new Date()), error);
          }
        });
      }

      // Member
      if (data.member.length > 0) {
        for (let i = 0; i < data.member.length; i++) {
          try {
            // console.log("MASUK 2.1", data.member[i].idMember)
            let condition = [{ username: data.member[i].username }];

            if (data.member[i].noKtp) condition.push({ noKtp: data.member[i].noKtp });
            if (data.member[i].email) condition.push({ email: data.member[i].email });

            let checkMember1 = await tblUser.findOne({
              where: {
                [Op.or]: condition,
              },
            });
            let checkMember2 = await tblMember.findByPk(data.member[i].idMember);

            // console.log("MASUK 2.2", data.member[i].idMember)

            if (checkMember1 || checkMember2) {
              // console.log('email', data.member[i].email);
              // console.log('username', data.member[i].username);
              if (checkMember1) console.log("checkMember1", condition);
              if (checkMember2) console.log("checkMember2", data.member[i].idMember);
              idMemberError.push(data.member[i].idMember);
            } else {
              let createMember;

              let newUser = {
                fullname: capitalize(data.member[i].namaLengkap),
                nickname: capitalize(data.member[i].namaPanggilan),
                noKtp: data.member[i].noKtp ? String(data.member[i].noKtp) : "000" + data.member[i].username,
                avatar: "/uploads/icon_user.png",
                email: data.member[i].email || data.member[i].username + "@email.com",
                gender: data.member[i].kelamin,
                igAccount: data.member[i].akunIg,
                haveWhatsapp: data.member[i].adaWhatsapp && data.member[i].adaWhatsapp.toLowerCase() === "iya" ? 1 : 0,

                roleId: 2,

                username: data.member[i].username,
              };
              if (data.member[i].tanggalLahir) newUser.dateOfBirth = new Date(data.member[i].tanggalLahir);

              let noHP = "" + data.member[i].nomorHp;
              if (Number(noHP[0]) === 0) {
                newUser.phone = "62" + noHP.slice(1, noHP.length);
              } else if (Number(noHP.slice(0, 2)) === 62) {
                newUser.phone = noHP;
              } else {
                newUser.phone = "62" + noHP;
              }

              if (!data.member[i].nomorHp) newUser.phone = null;

              let pass = `${createDateAsUTC(new Date(data.member[i].tanggalLahir)).getDate() < 10 ? `0${createDateAsUTC(new Date(data.member[i].tanggalLahir)).getDate()}` : createDateAsUTC(new Date(data.member[i].tanggalLahir)).getDate()}${
                createDateAsUTC(new Date(data.member[i].tanggalLahir)).getMonth() + 1 < 10 ? `0${createDateAsUTC(new Date(data.member[i].tanggalLahir)).getMonth() + 1}` : createDateAsUTC(new Date(data.member[i].tanggalLahir)).getMonth() + 1
              }${createDateAsUTC(new Date(data.member[i].tanggalLahir)).getFullYear()}`;

              newUser.password = hash(pass);

              if (data.member[i].status && (data.member[i].status.toLowerCase() === "aktif" || data.member[i].status.toLowerCase() === "beku")) {
                newUser.flagActive = 1;
              } else {
                newUser.flagActive = 0;
              }

              let createUser = await tblUser.create(newUser);
              if (createUser) {
                let newMember = {
                  memberId: data.member[i].idMember,
                  userId: createUser.null,
                  activeDate: data.member[i].tanggalAktifasiMember ? createDateAsUTC(new Date(data.member[i].tanggalAktifasiMember)) : null,
                  activeExpired: data.member[i].tanggalKadarluasaMember ? createDateAsUTC(new Date(data.member[i].tanggalKadarluasaMember)) : null,
                  ptSession: data.member[i].sesiPT || 0,
                  cardImage: "",
                  packageMembershipId: data.member[i].paketMembership,
                  ptId: data.member[i].ptId === "" ? null : data.member[i].ptId,
                  ptSessionOnline: data.member[i].sesiPTOnline || 0,
                  leaveDate: data.member[i].tanggalCuti || null,
                  isLeave: data.member[i].tanggalCuti ? 1 : null,
                  packagePTId: data.member[i].paketPT || "",
                };

                if (data.member[i].status && data.member[i].status.toLowerCase() === "beku") {
                  newMember.isFreeze = 1;
                  newMember.freezeDate = createDateAsUTC(new Date(data.member[i].tanggalBeku));
                }

                createMember = await tblMember.create(newMember);

                let nameImageCard = data.member[i].idMember;

                await QRCode.toFile(`./qr/${nameImageCard}.png`, `${nameImageCard}`, {
                  color: {
                    dark: "#000",
                    light: "#FFF", //background
                  },
                });

                if (createMember) await tblMember.update({ cardImage: `/qr/${nameImageCard}.png` }, { where: { memberId: nameImageCard } });
                console.log("Sukses", data.member[i].username);
              }
            }
          } catch (error) {
            idMemberError.push(data.member[i].idMember);
            console.log(createDateAsUTC(new Date()), error);
          }
        }
        console.log(idMemberError);
      }

      // Staff
      if (data.staff.length > 0) {
        let roles = await tblRole.findAll();
        await data.staff.forEach(async (element) => {
          try {
            let checkStaff1 = tblUser.findOne({
              where: {
                [Op.or]: [{ email: element.email }, { username: element.username }],
              },
            });
            let checkStaff2 = tblStaff.findOne({
              where: {
                [Op.or]: [{ staffId: element.idStaff }],
              },
            });

            if (checkStaff1 || checkStaff2) {
              idMemberError.push(element.idStaff);
            } else {
              let createStaff;

              let newUser = {
                fullname: capitalize(element.namaLengkap),
                nickname: capitalize(element.namaPanggilan),
                noKtp: String(element.noKtp),
                avatar: element.avatar || "/uploads/icon_user.png",
                dateOfBirth: new Date(element.tanggalLahir),
                email: element.email,
                gender: element.kelamin,
                igAccount: element.akunIg,
                haveWhatsapp: element.adaWhatsapp.toLowerCase() === "iya" ? 1 : 0,

                flagActive: 1,

                username: element.username,
              };

              let noHP = "" + element.nomorHp;
              if (Number(noHP[0]) === 0) {
                newUser.phone = "62" + noHP.slice(1, noHP.length);
              } else if (Number(noHP.slice(0, 2)) === 62) {
                newUser.phone = noHP;
              } else {
                newUser.phone = "62" + noHP;
              }

              let roleUser = await roles.find((role) => role.role.toLowerCase() === element.role.toLowerCase());

              newUser.roleId = roleUser.roleId;

              let pass = `${element.tanggalLahir.getDate() > 10 ? element.tanggalLahir.getDate() : `0${element.tanggalLahir.getDate()}`}${
                element.tanggalLahir.getMonth() + 1 > 10 ? element.tanggalLahir.getMonth() + 1 : `0${element.tanggalLahir.getMonth() + 1}`
              }${element.tanggalLahir.getFullYear()}`;

              newUser.password = hash(pass);

              let createUser = await tblUser.create(newUser);

              let newStaff = {
                staffId: element.idStaff,
                userId: createUser.null,
                isPermanent: element.jamMasuk.toLowerCase() === "shift" ? 0 : 1,
                available: 1,
              };

              if (createUser) createStaff = await tblStaff.create(newStaff);

              let nameImageCard = createStaff.null;

              await QRCode.toFile(`./qr/${nameImageCard}.png`, `${nameImageCard}`, {
                color: {
                  dark: "#000",
                  light: "#FFF", //background
                },
              });

              if (createStaff) await tblStaffs.update({ cardImage: `/qr/${nameImageCard}.png` }, { where: { userId: createStaff.userId } });
            }
          } catch (error) {
            console.log(createDateAsUTC(new Date()), error);
          }
        });
      }

      if (idMemberError.length > 0 || idStaffError.length > 0) {
        res.status(409).json({ idMemberError, idStaffError });
      } else {
        res.status(200).json({ message: "Success", data });
      }
    } catch (error) {
      next(error);
    }
  }

  static async freezeMember(req, res, next) {
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
      let closeDuration = 360;

      data.member.forEach(async (data) => {
        let member = await tblMember.findByPk(data.memberId);
        promises.push(
          tblMember.update(
            {
              isFreeze: true,
              freezeDate: createDateAsUTC(new Date()),
            },
            { where: { memberId: data.memberId } }
          )
        );

        let revenue = await tblRevenue.findAll({
          where: {
            [Op.and]: [
              {
                memberId: member.memberId,
                activeMembershipExpired: {
                  [Op.gte]: createDateAsUTC(new Date()),
                },
                packageAfter: { [Op.not]: null },
              },
            ],
          },
          order: [["activeMembershipExpired", "ASC"]],
        });

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
              dateActiveMembership: createDateAsUTC(new Date(moment(x.dateActiveMembership).add(closeDuration, "days").format("YYYY-MM-DD"))),
              activeMembershipExpired: createDateAsUTC(new Date(moment(x.activeMembershipExpired).add(closeDuration, "days").format("YYYY-MM-DD"))),
              status: "PENDING",
            };
          }

          promises.push(tblRevenue.update(updateRevenueData, { where: { id: x.id } }));
        });

        let cutiRevenue = {
          memberId: member.memberId,
          dateActiveMembership: createDateAsUTC(new Date()),
          activeMembershipExpired: createDateAsUTC(new Date()),
          packageBefore: "Beku",
          packageAfter: "Beku",
          times: 0,
          debit: 0,
          kredit: 0,
          saldo_member: revenue.length ? revenue[revenue.length - 1].saldo_member - revenue[revenue.length - 1].kredit : cekSisaHari(member.activeExpired),
          status: "CLOSED",
          keterangan: "Megafit Tutup",
          price: 0,
          is_event: true,
        };

        promises.push(tblRevenue.create(cutiRevenue));
      });

      await Promise.all(promises);
      res.status(200).json({ message: "Success" });
    } catch (error) {
      next(error);
    }
  }

  static async unfreeze(req, res, next) {
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
      data.member.forEach((x) => {
        let updateDate = {
          isHealthy: false,
          healthExpiredAt: createDateAsUTC(new Date()),
        };

        let config = {
          where: { memberId: x.memberId },
        };

        promises.push(tblMember.update(updateDate, config));
      });

      await Promise.all(promises);
      res.status(200).json({ message: "Success", data });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      let exeUpdate, newData;
      if (req.query["active-member"] === "true") {
        exeUpdate = await tblMember.update({ activeDate: createDateAsUTC(new Date()) }, { where: { userId: req.params.id } });
      } else if (req.query["select-pt"] === "true") {
        exeUpdate = await tblMember.update({ ptId: req.body.ptId }, { where: { memberId: req.params.id } });
      } else if (req.query["first-checkin"] === "true") {
        newData = {
          fullname: req.body.fullname,
          noKtp: req.body.noKtp,
        };
        exeUpdate = await tblUser.update(newData, {
          where: { userId: req.params.id },
        });
      } else if (req.query["health-confirmation"] === "true") {
        let expiredDate = new Date();
        expiredDate.setDate(new Date().getDate() + 14);

        newData = {
          isHealthy: req.body.isHealthy,
          healthExpiredAt: createDateAsUTC(expiredDate),
        };

        exeUpdate = await tblMember.update(newData, {
          where: { userId: req.params.id },
        });
      } else if (req.query["change-phone"] === "true") {
        let foundMember = await tblMember.findOne({
          where: { userId: req.params.id },
        });
        // Freeze data
        let freezeUpdate = {
          hasSeenSdkFreeze: true,
          isFreeze: req.body.isFreeze,
          freezeDate: req.body.freezeDate || req.body.freezeDate !== undefined ? req.body.freezeDate : foundMember.freezeDate,
          unfreezeDate: !req.body.isFreeze ? createDateAsUTC(new Date()) : null,
        };

        let revenueData;
        let cutiRevenue;

        if (foundMember.freezeDate && !req.body.isFreeze && foundMember.isLeave) {
          revenueData = await tblRevenue.findAll({
            where: {
              [Op.and]: [
                {
                  memberId: foundMember.memberId,
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
            attributes: { exclude: ["createdAt", "updatedAt"] },
            order: [["activeMembershipExpired", "ASC"]],
          });

          cutiRevenue = await tblRevenue.findOne({
            where: {
              [Op.and]: [
                {
                  memberId: foundMember.memberId,
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
            attributes: { exclude: ["createdAt", "updatedAt"] },
            order: [["activeMembershipExpired", "ASC"]],
          });

          freezeUpdate.leaveDate = createDateAsUTC(new Date(moment().subtract(cekSisaHari(foundMember.freezeDate, foundMember.leaveDate), "days").format("YYYY-MM-DD")));
        } else {
          revenueData = await tblRevenue.findAll({
            where: {
              [Op.and]: [
                {
                  memberId: foundMember.memberId,
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
            attributes: { exclude: ["createdAt", "updatedAt"] },
            order: [["activeMembershipExpired", "ASC"]],
          });
        }

        if (foundMember.freezeDate && !req.body.isFreeze) {
          freezeUpdate.activeExpired = createDateAsUTC(new Date(moment().add(cekSisaHari(foundMember.activeExpired, foundMember.freezeDate), "days").format("YYYY-MM-DD")));
        }

        let promises = [];
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
          await revenueData.forEach((x) => {
            if (x.status === "PENDING") {
              updateRevenueData = {
                dateActiveMembership: createDateAsUTC(new Date(moment(x.dateActiveMembership).add(cekSisaHari(new Date(), foundMember.freezeDate), "days"))),
                activeMembershipExpired: createDateAsUTC(new Date(moment(x.activeMembershipExpired).add(cekSisaHari(new Date(), foundMember.freezeDate), "days"))),
              };
            } else {
              updateRevenueData = {
                pending_saldo: 0,
              };

              let newRevenueData = {
                ...x.dataValues,
                dateActiveMembership: createDateAsUTC(new Date()),
                activeMembershipExpired: createDateAsUTC(new Date(moment().add(x.pending_saldo, "days").format("YYYY-MM-DD"))),
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

              delete newRevenueData.id;
              promises.push(tblRevenue.create(newRevenueData));
            }

            promises.push(tblRevenue.update(updateRevenueData, { where: { id: x.id } }));
          });
        }

        if (promises.length) await Promise.all(promises);

        exeUpdate = await tblMember.update(freezeUpdate, {
          where: { memberId: foundMember.memberId },
        });

        // Update Data
        if (req.body.phone || req.body.email) {
          let phoneData;
          if (Number(req.body.phone[0]) === 0) {
            phoneData = "62" + req.body.phone.slice(1, req.body.phone.length);
          } else if (Number(req.body.phone[0]) === 8) {
            phoneData = "62" + req.body.phone;
          } else if (Number(req.body.phone.slice(0, 2)) === 62) {
            phoneData = req.body.phone;
          }

          let checkDataExist = await tblUser.findAll({
            where: {
              [Op.or]: [{ phone: phoneData }, { email: req.body.email }],
              userId: { [Op.not]: req.user.userId },
            },
          });
          // TOLAK KALO DATA SUDAH ADA
          if (checkDataExist.length) {
            await tblUser.update({ isDataConflict: true }, { where: { userId: req.user.userId } });
            throw { name: "unauthorized" };
          } else {
            // DATA TIDAK ADA
            newData = {
              email: req.body.email,
              haveWhatsapp: req.body.haveWhatsapp,
              agreePromo: req.body.agreePromo,
              phone: phoneData,
              isDataConflict: false,
            };

            exeUpdate = await tblUser.update(newData, {
              where: { userId: req.user.userId },
            });
          }
        }
      } else if (req.query["change-password"] === "true") {
        // Change password
        if (compare(req.body.passwordLama, req.user.password)) {
          newData = {
            password: hash(req.body.passwordBaru),
          };

          exeUpdate = await tblUser.update(newData, {
            where: { userId: req.user.userId },
          });
        } else {
          throw { name: "badPassword" };
        }
      } else if (req.query["reset-password"] === "true") {
        // Change password
        newData = {
          password: hash(req.body.password),
        };

        exeUpdate = await tblUser.update(newData, {
          where: { userId: req.user.userId },
        });
      } else if (req.query["data-size"] === "true") {
        //Input Data Size
        let member = await tblMember.findOne({ where: { userId: req.params.id } });

        await tblMember.update({ hasConfirmTermAndCondition: true }, { where: { memberId: member.memberId } });

        let oldData = await tblDataSizeMember.findOne({
          where: { memberId: member.memberId },
          order: [["id", "DESC"]],
        });

        let newData = {
          umur: Number(req.body.umur) !== 0 ? req.body.umur : oldData && oldData.umur ? oldData.umur : 0,
          height: Number(req.body.height) !== 0 ? req.body.height : oldData && oldData.height ? oldData.height : 0,
          weight: Number(req.body.weight) !== 0 ? req.body.weight : oldData && oldData.weight ? oldData.weight : 0,
          triceps: Number(req.body.triceps) !== 0 ? req.body.triceps : oldData && oldData.triceps ? oldData.triceps : 0,
          dada: Number(req.body.dada) !== 0 ? req.body.dada : oldData && oldData.dada ? oldData.dada : 0,
          perut: Number(req.body.perut) !== 0 ? req.body.perut : oldData && oldData.perut ? oldData.perut : 0,
          pinggul: Number(req.body.pinggul) !== 0 ? req.body.pinggul : oldData && oldData.pinggul ? oldData.pinggul : 0,
          pinggang: Number(req.body.pinggang) !== 0 ? req.body.pinggang : oldData && oldData.pinggang ? oldData.pinggang : 0,
          paha: Number(req.body.paha) !== 0 ? req.body.paha : oldData && oldData.paha ? oldData.paha : 0,
          targetWeight: +req.body.targetWeight !== 0 ? +req.body.targetWeight : oldData && oldData.targetWeight ? oldData.targetWeight : 0,
          targetTriceps: +req.body.targetTriceps !== 0 ? +req.body.targetTriceps : oldData && oldData.targetTriceps ? oldData.targetTriceps : 0,
          targetDada: +req.body.targetDada !== 0 ? +req.body.targetDada : oldData && oldData.targetDada ? oldData.targetDada : 0,
          targetPerut: +req.body.targetPerut !== 0 ? +req.body.targetPerut : oldData && oldData.targetPerut ? oldData.targetPerut : 0,
          targetPinggul: +req.body.targetPinggul !== 0 ? +req.body.targetPinggul : oldData && oldData.targetPinggul ? oldData.targetPinggul : 0,
          targetPinggang: +req.body.targetPinggang !== 0 ? +req.body.targetPinggang : oldData && oldData.targetPinggang ? oldData.targetPinggang : 0,
          targetPaha: +req.body.targetPaha !== 0 ? +req.body.targetPaha : oldData && oldData.targetPaha ? oldData.targetPaha : 0,
          memberId: member.memberId,
        };

        exeUpdate = await tblDataSizeMember.create(newData);
      } else {
        let newUserData = {
          username: req.body.username,
          fullname: req.body.fullname,
          nickname: req.body.nickname,
          noKtp: req.body.noKtp,
          email: req.body.email,
          gender: req.body.gender,
          igAccount: req.body.igAccount,
          haveWhatsapp: req.body.haveWhatsapp,
          flagActive: new Date(req.body.activeExpired) >= createDateAsUTC(new Date()) ? true : false,
        };
        if (req.body.roleId) newUserData.roleId = req.body.roleId;
        if (req.body.dateOfBirth) newUserData.dateOfBirth = new Date(req.body.dateOfBirth);
        if (Number(req.body.phone[0]) === 0) {
          newUserData.phone = "62" + req.body.phone.slice(1, req.body.phone.length);
        } else if (Number(req.body.phone[0]) === 8) {
          newUserData.phone = "62" + req.body.phone;
        } else if (Number(req.body.phone.slice(0, 2)) === 62) {
          newUserData.phone = req.body.phone;
        }
        if (req.body.password) newUserData.password = hash(req.body.password);
        exeUpdate = await tblUser.update(newUserData, {
          where: { userId: req.params.id },
        });

        if (req.body.activeExpired) {
          await tblMember.update(
            {
              activeExpired: req.body.activeExpired === "null" || !req.body.activeExpired ? null : createDateAsUTC(new Date(req.body.activeExpired)),
              activeDate: req.body.activeDate === "null" || !req.body.activeDate ? null : createDateAsUTC(new Date(req.body.activeDate)),
              ptId: req.body.ptId === "null" ? null : req.body.ptId,
              packageMembershipId: req.body.packageMembershipId === "null" || !req.body.packageMembershipId ? null : req.body.packageMembershipId,
              memberId: req.body.memberId,
              ptSession: +req.body.ptSession,
              freezeDate: req.body.isFreeze === "true" ? req.body.freezeDate : null,
              isFreeze: req.body.isFreeze === "true" ? req.body.isFreeze : false,
            },
            { where: { userId: req.params.id } }
          );
        }

        if (req.body.NIK || req.body.canPTOnline) {
          await tblStaff.update({ NIK: req.body.NIK, canPTOnline: req.body.canPTOnline }, { where: { userId: req.params.id } });
        }
      }
      let dataReturn = await tblUser.findByPk(req.params.id, {
        include: [
          { model: tblStaff, as: "staff" },
          {
            model: tblMember,
            include: [
              {
                model: tblDataSizeMember,
                order: [["createdAt", "DESC"]],
              },
            ],
          },
        ],
      });

      if (exeUpdate) res.status(200).json({ message: "Success", data: dataReturn });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
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
              B: "fullname",
            },
          },
        ],
      });

      let promises = [];

      data.member.forEach(async (x) => {
        promises.push(tblUser.destroy({ where: { fullname: x.fullname } }));
        promises.push(tblMember.destroy({ where: { memberId: x.memberId } }));
      });

      await Promise.all(promises);

      res.status(200).json({ message: "Success", data });
    } catch (error) {
      next(error);
    }
  }
}

function cekSisaHari(args, args2) {
  if (!args) return -30;

  let a = args2 ? moment(args2, "YYYY-MM-DD") : moment().format("YYYY-MM-DD");
  let b = moment(args, "YYYY-MM-DD");

  return b.diff(a, "days"); //TODO ex: 28-11-2022 - now Date()
}

function capitalize(name) {
  return (name = name
    .toLowerCase()
    .split(" ")
    .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
    .join(" "));
}

module.exports = usersController;
