const { tblPackageMemberships, tblSubCategoryMembership } = require("../models");

class packageMembership {
  static async create(req, res, next) {
    try {
      let newPackageMembership = {
        packageMembershipId: req.body.packageMembershipId,
        package: req.body.package,
        subCategoryMembershipId: req.body.subCategoryMembershipId,
        price: req.body.price,
        activeMember: 0,
        times: req.body.times,
      };
      if (Number(req.body.categoryMembershipId) === 2 || Number(req.body.categoryMembershipId) === 5) newPackageMembership.sessionPtHours = req.body.sessionPtHours;

      let createPackageMember = await tblPackageMemberships.create(newPackageMembership);
      res.status(201).json({ message: "Success", data: createPackageMember });
    } catch (error) {
      next(error);
    }
  }

  static async findAll(req, res, next) {
    try {
      let data;
      if (req.query.onlyActive === "true") {
        data = await tblPackageMemberships.findAll({
          include: [
            {
              model: tblSubCategoryMembership,
              where: { activeFlag: 1 },
            },
          ],
          order: [
            ["times", "ASC"],
            ["packageMembershipId", "ASC"],
            ["package", "DESC"],
          ],
        });
      } else {
        data = await tblPackageMemberships.findAll({
          include: [
            {
              model: tblSubCategoryMembership,
              where: { activeFlag: 1 },
            },
          ],
          order: [
            ["times", "ASC"],
            ["packageMembershipId", "ASC"],
            ["package", "DESC"],
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
      let data = await tblPackageMemberships.findAll({
        include: [
          {
            model: tblSubCategoryMembership,
          },
        ],
        order: [
          ["times", "ASC"],
          ["packageMembershipId", "ASC"],
          ["package", "DESC"],
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
      let newPackageMembership = {
        package: req.body.package,
        subCategoryMembershipId: req.body.subCategoryMembershipId,
        price: req.body.price,
        times: req.body.times,
      };
      if (Number(req.body.categoryMembershipId) === 2 || Number(req.body.categoryMembershipId) === 5) newPackageMembership.sessionPtHours = req.body.sessionPtHours;

      await tblPackageMemberships.update(newPackageMembership, {
        where: { packageMembershipId: req.params.id },
      });

      let dataReturn = await tblPackageMemberships.findByPk(req.params.id, {
        include: [{ model: tblSubCategoryMembership }],
      });
      if (!dataReturn) throw { name: "notFound" };
      res.status(200).json({ message: "Success", data: dataReturn });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res) {
    try {
      let deletePackageMembership = await tblPackageMemberships.destroy({
        where: { packageMembershipId: req.params.id },
      });

      if (!deletePackageMembership) throw { name: "notFound" };
      res.status(200).json({ message: "Success", idDeleted: req.params.id });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = packageMembership;
