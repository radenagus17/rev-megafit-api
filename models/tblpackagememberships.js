"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class tblPackageMemberships extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      tblPackageMemberships.belongsTo(models.tblSubCategoryMembership, {
        foreignKey: "subCategoryMembershipId",
      });
      // tblPackageMemberships.hasMany(models.tblMemberships, { foreignKey: 'packageMembershipId' });
      tblPackageMemberships.hasMany(models.tblMember, {
        foreignKey: "packageMembershipId",
        as: "packageMembership",
      });
      tblPackageMemberships.hasMany(models.tblMember, {
        foreignKey: "packagePTId",
        as: "packagePT",
      });
      tblPackageMemberships.hasMany(models.tblOrderList, {
        foreignKey: "packageMembershipId",
      });
      tblPackageMemberships.hasMany(models.tblPromo, { foreignKey: "product" });
    }
  }
  tblPackageMemberships.init(
    {
      packageMembershipId: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      package: DataTypes.STRING,
      subCategoryMembershipId: DataTypes.INTEGER,
      times: DataTypes.INTEGER,
      price: DataTypes.INTEGER,
      activeMember: DataTypes.INTEGER,
      sessionPtHours: DataTypes.INTEGER,
      classUsed: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "tblPackageMemberships",
    }
  );
  return tblPackageMemberships;
};
