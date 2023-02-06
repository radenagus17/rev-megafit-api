const { tblPackageMemberships, tblSubCategoryMembership, tblCategoryMembership } = require("../models");
const Op = require("sequelize").Op;

class subCategoryMembership {
  static async create(req, res, next) {
    try {
      if (Number(req.body.isMainPackage) === 1) {
        await tblSubCategoryMembership.update({ isMainPackage: 0 }, { where: { categoryMembershipId: req.body.categoryMembershipId } });
      }
      let subCategoryMemberships = await tblSubCategoryMembership.create({
        subCategoryMembership: req.body.package,
        categoryMembershipId: req.body.categoryMembershipId,
        startPromo: req.body.startPromo,
        endPromo: req.body.endPromo,
        access: req.body.access,
        adminFee: req.body.adminFee || 0,
        activeFlag: 1,
        isMainPackage: req.body.isMainPackage,
      });

      if (Number(req.body.isMainPackage) === 1) {
        await tblCategoryMembership.update({ mainPackageId: subCategoryMemberships.id }, { where: { categoryMembershipId: req.body.categoryMembershipId } });
      }

      let newPackageMembership = {
        packageMembershipId: req.body.packageMembershipId,
        package: req.body.package,
        subCategoryMembershipId: subCategoryMemberships.id,
        price: req.body.price,
        activeMember: 0,
        times: req.body.times,
      };
      if (Number(req.body.categoryMembershipId) === 2 || Number(req.body.categoryMembershipId) === 5) newPackageMembership.sessionPtHours = req.body.sessionPtHours;

      await tblPackageMemberships.create(newPackageMembership);

      let grosirPrice;

      if (typeof req.body.grosirPrice === "object") {
        grosirPrice = req.body.grosirPrice;
      } else {
        grosirPrice = JSON.parse(req.body.grosirPrice);
      }

      grosirPrice.forEach(async (element) => {
        let newPackageMembership = {
          packageMembershipId: element.id,
          package: req.body.package,
          subCategoryMembershipId: subCategoryMemberships.id,
          price: element.price,
          activeMember: 0,
          times: element.times,
        };
        if (Number(req.body.categoryMembershipId) === 2 || Number(req.body.categoryMembershipId) === 5) newPackageMembership.sessionPtHours = element.sessionPtHours;

        await tblPackageMemberships.create(newPackageMembership);
      });

      res.status(201).json({ message: "Success", data: subCategoryMemberships });
    } catch (error) {
      next(error);
    }
  }

  static async findMainPackage(req, res, next) {
    try {
      let data = await tblSubCategoryMembership.findAll({
        where: {
          [Op.or]: [{ categoryMembershipId: 2 }, { categoryMembershipId: 4 }, { categoryMembershipId: 5 }],
          isMainPackage: true,
          activeFlag: true,
        },
        include: { model: tblPackageMemberships },
      });
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  static async findAll(req, res, next) {
    try {
      let data;

      if (req.query.category) {
        data = await tblSubCategoryMembership.findAll({
          where: {
            categoryMembershipId: req.query.category,
            activeFlag: 1,
          },
          include: [
            {
              model: tblPackageMemberships,
            },
          ],
        });
      } else {
        data = await tblSubCategoryMembership.findAll({
          include: [
            {
              model: tblPackageMemberships,
            },
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
      let data = await tblSubCategoryMembership.findByPk(req.params.id, {
        include: [
          {
            model: tblPackageMemberships,
            order: [
              ["times", "ASC"],
              ["packageMembershipId", "ASC"],
              ["package", "DESC"],
            ],
          },
        ],
      });
      if (!data) throw { name: "notFound" };
      res.status(200).json({ message: "Success", data });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      if (Number(req.body.isMainPackage) === 1) {
        await tblSubCategoryMembership.update({ isMainPackage: 0 }, { where: { categoryMembershipId: req.body.categoryMembershipId } });
      }

      //Update Sub category
      let subCategoryMemberships = await tblSubCategoryMembership.update(
        {
          subCategoryMembership: req.body.package,
          categoryMembershipId: req.body.categoryMembershipId,
          startPromo: req.body.startPromo,
          endPromo: req.body.endPromo,
          access: req.body.access,
          adminFee: req.body.adminFee || 0,
          activeFlag: req.body.activeFlag,
          isMainPackage: req.body.isMainPackage,
        },
        { where: { id: req.params.id } }
      );

      if (Number(req.body.isMainPackage) === 1) {
        await tblCategoryMembership.update({ mainPackageId: req.params.id }, { where: { categoryMembershipId: req.body.categoryMembershipId } });
      }

      if (req.body.packageMembershipId) {
        //Update Package
        let newPackageMembership = {
          package: req.body.package,
          subCategoryMembershipId: req.params.id,
          price: req.body.price,
          times: req.body.times,
        };
        if (Number(req.body.categoryMembershipId) === 2 || Number(req.body.categoryMembershipId) === 5) newPackageMembership.sessionPtHours = req.body.sessionPtHours;

        let grosirPrice;

        if (typeof req.body.grosirPrice === "object") {
          grosirPrice = req.body.grosirPrice;
        } else {
          grosirPrice = JSON.parse(req.body.grosirPrice);
        }

        //Update change Package Grosir
        grosirPrice.forEach(async (element) => {
          let newPackageMembership = {
            packageMembershipId: element.id,
            package: req.body.package,
            subCategoryMembershipId: req.params.id,
            price: element.price,
            activeMember: 0,
            times: element.times,
          };
          if (Number(req.body.categoryMembershipId) === 2 || Number(req.body.categoryMembershipId) === 5) newPackageMembership.sessionPtHours = element.sessionPtHours;

          await tblPackageMemberships.upsert(newPackageMembership);
        });

        //Delete package when not available in grosirPrice
        let packageMemberships = await tblPackageMemberships.findAll({
          where: { subCategoryMembershipId: req.params.id },
        });

        packageMemberships.forEach(async (element, index) => {
          if (index !== 0) {
            let isAvailable = grosirPrice.find((el) => el.id === element.packageMembershipId);

            if (!isAvailable) {
              await tblPackageMemberships.destroy({
                where: { packageMembershipId: element.packageMembershipId },
              });
            }
          }
        });
      }

      let dataReturn = await tblSubCategoryMembership.findByPk(req.params.id);
      if (!subCategoryMemberships) throw { name: "notFound" };
      res.status(200).json({ message: "Success", data: dataReturn });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      let deletePackageMembership = await tblSubCategoryMembership.destroy({
        where: { id: req.params.id },
      });

      if (!deletePackageMembership) throw { name: "notFound" };
      res.status(200).json({ message: "Success", idDeleted: req.params.id });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = subCategoryMembership;
