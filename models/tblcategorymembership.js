"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class tblCategoryMembership extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      tblCategoryMembership.hasMany(models.tblSubCategoryMembership, { foreignKey: "categoryMembershipId" });
      tblCategoryMembership.hasMany(models.tblOrderList, { foreignKey: "categoryMembershipId" });
      tblCategoryMembership.belongsTo(models.tblSubCategoryMembership, { foreignKey: "mainPackageId" });
    }
  }
  tblCategoryMembership.init(
    {
      categoryMembershipId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      categoryMembership: DataTypes.STRING,
      mainPackageId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "tblCategoryMembership",
    }
  );
  return tblCategoryMembership;
};
