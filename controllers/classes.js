const { tblClasses, tblUser, tblHistoryClasses, tblSubCategoryMembership, tblMemberClasses, tblMember } = require("../models");
const { log } = require("../helpers/log");
const { createDateAsUTC } = require("../helpers/convertDate");

class classesController {
  static async create(req, res, next) {
    try {
      let dataReturn;

      let newClass = {
        subCategoryMembershipId: req.body.subCategoryMembershipId,
        ptId: req.body.ptId,
        timeIn: req.body.timeIn,
        timeOut: req.body.timeOut,
        date: req.body.date,
        week: req.body.week,
        month: req.body.month,
        year: req.body.year,
        color: req.body.color,
        linkZoom: req.body.linkZoom,
        limit: req.body.limit,
        // isPremium: req.body.isPremium,
      };

      let createClass = await tblClasses.create(newClass);

      dataReturn = await tblClasses.findByPk(createClass.id, {
        include: [{ model: tblSubCategoryMembership }, { model: tblUser }],
      });

      res.status(201).json({ message: "Success", data: dataReturn });

      let newData = {
        userId: req.user.userId,
        url: `http://megafit.co.id/classes`,
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
    let data,
      query = "";
    try {
      if (req.query.active === "true") {
        //only class active
        query = "?active=true";
        data = await tblClasses.findAll({
          where: { flagActive: 1 },
          include: [{ model: tblSubCategoryMembership }, { model: tblUser }],
          attributes: { exclude: ["linkZoom"] },
        });
      } else if (req.query.only === "name") {
        //only class active
        query = "?only=name";
        data = await tblSubCategoryMembership.findAll({ where: { isActive: 1 } });
      } else if (req.query.all === "true") {
        //all class
        data = await tblClasses.findAll({
          where: {
            week: req.query.week,
            year: req.query.year,
          },
          include: [
            { model: tblSubCategoryMembership },
            { model: tblUser },
            {
              model: tblHistoryClasses,
              required: false,
              include: [{ model: tblUser }],
            },
          ],
          attributes: { exclude: ["linkZoom"] },
          order: [["timeIn", "ASC"]],
        });
      } else if (req.query["class-megafit"] === "true") {
        let { memberId } = await tblMember.findOne({
          where: { userId: req.user.userId },
        });
        data = await tblMemberClasses.findAll({
          where: { memberId },
          include: [{ model: tblSubCategoryMembership }],
        });
      } else {
        //all class
        data = await tblClasses.findAll({
          attributes: { exclude: ["linkZoom"] },
          include: [{ model: tblSubCategoryMembership }, { model: tblUser }],
        });
      }
      if (data) res.status(200).json({ message: "Success", totalRecord: data.length, data });

      let newData = {
        userId: req.user.userId,
        url: `http://megafit.co.id/classes${query}`,
        method: "get",
        status: 200,
        message: "",
      };
      log(newData);
    } catch (error) {
      next(error);
    }
  }

  static async findOne(req, res, next) {
    try {
      let data = await tblClasses.findByPk(req.params.id, {
        include: [{ model: tblSubCategoryMembership }, { model: tblUser }],
        attributes: { exclude: ["linkZoom"] },
      });

      if (data) {
        res.status(200).json({ message: "Success", data });

        let newData = {
          userId: req.user.userId,
          url: `http://megafit.co.id/classes/${req.params.id}`,
          method: "get",
          status: 200,
          message: "",
        };
        log(newData);
      } else throw { name: "notFound" };
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    let createNewClasses,
      query = "";
    try {
      if (req.query.edit === "class") {
        //update class
        query = "?edit=class";

        let dataReturn;
        let newClass = {
          subCategoryMembershipId: req.body.subCategoryMembershipId,
          ptId: req.body.ptId,
          timeIn: req.body.timeIn,
          timeOut: req.body.timeOut,
          date: req.body.date,
          week: req.body.week,
          month: req.body.month,
          year: req.body.year,
          color: req.body.color,
          linkZoom: req.body.linkZoom,
          limit: req.body.limit,
          // isPremium: req.body.isPremium,
        };
        let updateClass = await tblClasses.update(newClass, {
          where: { id: req.params.id },
        });

        dataReturn = await tblClasses.findByPk(req.params.id, {
          include: [{ model: tblSubCategoryMembership }, { model: tblUser }],
        });
        if (updateClass) res.status(200).json({ message: "Success", data: dataReturn });
        // } else if (req.query.edit === "class-premium") {
        //   //update class
        //   query = "?edit=class-premium";
        //   let updateClass = await tblClasses.update({ isPremium: req.body.isPremium }, { where: { id: req.params.id } });
        //   let dataReturn = await tblClasses.findByPk(req.params.id, {
        //     include: [{ model: tblSubCategoryMembership }, { model: tblUser }],
        //     attributes: { exclude: ["linkZoom"] },
        //   });
        //   if (updateClass) res.status(200).json({ message: "Success", data: dataReturn });
      } else if (req.query.edit === "pt") {
        //update pt
        query = "?edit=pt";
        if (req.body.permanent === "true") {
          //update pt permanent
          await tblClasses.destroy({
            where: { id: req.params.id, date: null },
          });

          let newClass = {
            id: req.params.id,
            ptId: req.body.userId,
          };

          createNewClasses = await tblClasses.create(newClass);
        } else {
          //update pt temporary
          let newClasses = {
            id: req.params.id,
            ptId: req.body.userId,
            date: req.body.classDate,
          };

          createNewClasses = await tblClasses.create(newClasses);
        }

        let dataReturn = tblClasses.findByPk(req.params.id, {
          include: [{ model: tblUser }],
        });

        if (createNewClasses && dataReturn) res.status(200).json({ message: "Success", data: dataReturn });
        else throw { name: "notFound" };
      }

      let newData = {
        userId: req.user.userId,
        url: `http://megafit.co.id/classes/${req.params.id}${query}`,
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
      let deleteClass;
      deleteClass = await tblClasses.destroy({ where: { id: req.params.id } });

      if (deleteClass) {
        res.status(200).json({ message: "Success", idDeleted: req.params.id });

        let newData = {
          userId: req.user.userId,
          url: `http://megafit.co.id/classes/${req.params.id}`,
          method: "delete",
          status: 200,
          message: "",
        };
        log(newData);
      } else throw { name: "notFound" };
    } catch (error) {
      next(error);
    }
  }

  //   todo: for member
  static async joinClass(req, res, next) {
    try {
      let { memberId, activeExpired } = await tblMember.findOne({
        where: { userId: req.user.userId },
      });
      
      if (createDateAsUTC(new Date(activeExpired)) >= createDateAsUTC(new Date())) {
        let data = await tblClasses.findByPk(req.params.id, { include: tblHistoryClasses });

        if (data.tblHistoryClasses.length > 0 && data.limit <= data.tblHistoryClasses.length) throw { name: "slotFull" };

        let dataMemberClass = await tblMemberClasses.findOne({
          where: {
            memberId,
            subCategoryMembershipId: data.subCategoryMembershipId,
          },
        });

        if (dataMemberClass) {
          if (dataMemberClass.times - 1 > 0) {
            await tblMemberClasses.update({ times: dataMemberClass.times - 1 }, { where: { id: dataMemberClass.id } });
          } else {
            await tblMemberClasses.destroy({ where: { id: dataMemberClass.id } });
          }
        }
      }
      // tblMemberClasses
      let newData = {
        userId: req.user.userId,
        classId: req.params.id,
        hasJoined: 1,
      };

      let joinClass = await tblHistoryClasses.create(newData);

      res.status(200).json({ message: "Success", data: joinClass });
    } catch (error) {
      next(error);
    }
  }

  static async cancelJoinClass(req, res, next) {
    try {
      let { memberId } = await tblMember.findOne({
        where: { userId: req.user.userId },
      });

      let data = await tblClasses.findByPk(req.query.class, { include: tblHistoryClasses });

      let dataMemberClass = await tblMemberClasses.findOne({
        where: {
          memberId,
          subCategoryMembershipId: data.subCategoryMembershipId,
        },
      });

      if (dataMemberClass) {
        await tblMemberClasses.update({ times: dataMemberClass.times + 1 }, { where: { id: dataMemberClass.id } });
      } else {
        let newData = {
          memberId,
          subCategoryMembershipId: data.subCategoryMembershipId,
          times: 1,
        };
        await tblMemberClasses.create(newData);
      }

      await tblHistoryClasses.destroy({ where: { id: req.params.id } });

      res.status(200).json({ message: "Success", idDeleted: req.params.id });

      //   let member = await tblMembers.findOne({ where: { userId: req.user.userId } });
      //   await tblMembers.update({ ptSession: member.ptSession + 1 }, { where: { userId: req.user.userId } });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = classesController;
