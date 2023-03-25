const { tblClasses, tblUser, tblHistoryClasses, tblSubCategoryMembership, tblMemberClasses, tblMember, tblPackageClasses, tblRevenue, tblPackageMemberships } = require("../models");
const { log } = require("../helpers/log");
const { createDateAsUTC } = require("../helpers/convertDate");
const Op = require("sequelize").Op;
const moment = require("moment");

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
            { model: tblSubCategoryMembership,
              include: [{ model: tblPackageClasses }]
            },
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

  //todo: for member
  static async joinClass(req, res, next) {
    try {
      let { memberId, activeExpired } = await tblMember.findOne({
        where: { userId: req.user.userId },
      });
      
      let dataClasses = await tblClasses.findByPk(req.params.id, { 
        include: { model: tblSubCategoryMembership,
                   include: { model: tblPackageMemberships }
                 }
       })
       
       if(dataClasses.date !== new Date().getDate() || dataClasses.month !== new Date().getMonth() + 1 || dataClasses.year !== new Date().getFullYear() || !dataClasses) throw { name: "notAlreadyClass" }

       //? first time member join class basic
       if (!dataClasses.tblSubCategoryMembership.isPremium) {
        const checkBasic = await tblPackageClasses.findAll({
          where: {
            [Op.and]: [{ memberId }, { classSession: { [Op.ne]: 0 } }, { subCategoryMembershipId: dataClasses.tblSubCategoryMembership.id }],
           },
           order: [["id", "ASC"]],
        })
          if((!checkBasic.length && !dataClasses.tblSubCategoryMembership.isPremium) || (!checkBasic[0].classSession && undefined))
            await tblPackageClasses.create({
             memberId, subCategoryMembershipId: dataClasses.subCategoryMembershipId, activeDate: createDateAsUTC(new Date()), expiredDate: activeExpired, classSession: dataClasses.tblSubCategoryMembership.tblPackageMemberships[0].classUsed
            })
       }
       
       let checkPackageClasses = await tblPackageClasses.findAll({
         where: {
           [Op.and]: [{ memberId }, { classSession: { [Op.ne]: 0 } }, { expiredDate: { [Op.gte]: moment().format("YYYY-MM-DD") } }, { subCategoryMembershipId: dataClasses.tblSubCategoryMembership.id }],
          },
          order: [["id", "ASC"]],
        })


      let revenue = await tblRevenue.findAll({
        where: {
          [Op.and]: [{ memberId }, { activeMembershipExpired: { [Op.gte]: moment().format("YYYY-MM-DD") } }, { packageBefore: dataClasses.tblSubCategoryMembership.tblPackageMemberships[0].package }, { kredit: { [Op.ne]: dataClasses.tblSubCategoryMembership.tblPackageMemberships[0].classUsed }}, { status: { [Op.ne]: "CLOSED" } }]
        }
      })

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
      }else throw { name: "memberExp" }
      
      if (!checkPackageClasses.length) throw { name: "memberExp" }
      await tblPackageClasses.update({
        classSession: checkPackageClasses[0].classSession - 1
      }, { where: { id: checkPackageClasses[0].id } } )
    
      if(revenue.length){
        await tblRevenue.update({
          status: revenue[0].kredit + 1 === revenue[0].times ? "CLOSED" : "OPEN",
          kredit: revenue[0].kredit + 1
        }, { where: { id: revenue[0].id }})
      }
      
      const returningPackageClasses = await tblPackageClasses.findOne({
        where: {
          [Op.and]: [{memberId}, { expiredDate: new Date(checkPackageClasses[0].expiredDate) }, { subCategoryMembershipId: dataClasses.tblSubCategoryMembership.id }]
        },
      })

      if(returningPackageClasses.classSession === 0) await tblPackageClasses.destroy({ where: { id: returningPackageClasses.id } });

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

      let data = await tblClasses.findByPk(req.query.class, { include: [{
        model: tblSubCategoryMembership,
        include: { model: tblPackageMemberships }
      }, { model: tblHistoryClasses } ] });

      if(!data.tblHistoryClasses.length || data.tblHistoryClasses[0].id !== +req.params.id) throw { name: "notAlreadyClass" }

      let dataMemberClass = await tblMemberClasses.findOne({
        where: {
          memberId,
          subCategoryMembershipId: data.subCategoryMembershipId,
        },
      });

      let checkPackageClasses = await tblPackageClasses.findAll({
        where: {
          [Op.and]: [{ memberId }, { classSession: { [Op.gte]: 0 } }, { expiredDate: { [Op.gte]: moment().format("YYYY-MM-DD") } }, { subCategoryMembershipId: data.subCategoryMembershipId }],
        },
        order: [["id", "ASC"]],
      })
      
      if (!checkPackageClasses.length) throw { name: "memberExp" }
      
      let revenue = await tblRevenue.findAll({
        where: {
          [Op.and]: [{ memberId }, { activeMembershipExpired: { [Op.gte]: moment().format("YYYY-MM-DD") } }, { packageBefore: data.tblSubCategoryMembership.tblPackageMemberships[0].package }, { kredit: { [Op.lte]: data.tblSubCategoryMembership.tblPackageMemberships[0].classUsed }}]
        }
      })

      if (dataMemberClass) {
        await tblMemberClasses.update({ times: dataMemberClass.times + 1 }, { where: { id: dataMemberClass.id } });
      } else {
        let newData = {
          memberId,
          subCategoryMembershipId: data.subCategoryMembershipId,
          times: 1,
          expired: checkPackageClasses[0].expiredDate
        };
        await tblMemberClasses.create(newData);
      }

      await tblPackageClasses.update({
        classSession: checkPackageClasses[0].classSession + 1
      }, { where: { id: checkPackageClasses[0].id } } )

      if(revenue.length){
        await tblRevenue.update({
          status: revenue[0].kredit === revenue[0].times ? "OPEN" : "OPEN",
          kredit: revenue[0].kredit - 1
        }, { where: { id: revenue[0].id }})
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
