"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class tblSubCategoryMembership extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      tblSubCategoryMembership.belongsTo(models.tblCategoryMembership, { foreignKey: "categoryMembershipId" });
      tblSubCategoryMembership.hasMany(models.tblPackageMemberships, { foreignKey: "subCategoryMembershipId" });
      tblSubCategoryMembership.hasOne(models.tblCategoryMembership, { foreignKey: "mainPackageId" });
    }
  }
  tblSubCategoryMembership.init(
    {
      subCategoryMembership: DataTypes.STRING,
      categoryMembershipId: DataTypes.INTEGER,
      startPromo: DataTypes.DATE,
      endPromo: DataTypes.DATE,
      access: DataTypes.STRING,
      adminFee: DataTypes.INTEGER,
      activeFlag: DataTypes.INTEGER,
      isMainPackage: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "tblSubCategoryMembership",
    }
  );
  return tblSubCategoryMembership;
};
