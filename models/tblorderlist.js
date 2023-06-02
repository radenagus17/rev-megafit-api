"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class tblOrderList extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      tblOrderList.belongsTo(models.tblTransaction, {
        foreignKey: "transactionId",
      });
      tblOrderList.belongsTo(models.tblPackageMemberships, {
        foreignKey: "packageMembershipId",
      });
      tblOrderList.belongsTo(models.tblCategoryMembership, {
        foreignKey: "categoryMembershipId",
      });
      tblOrderList.belongsTo(models.tblPromo, {
        foreignKey: "promo_1",
        as: "promo1",
      });
      tblOrderList.belongsTo(models.tblPromo, {
        foreignKey: "promo_2",
        as: "promo2",
      });
    }
  }
  tblOrderList.init(
    {
      transactionId: DataTypes.INTEGER,
      salesInvoice: DataTypes.STRING,
      packageMembershipId: DataTypes.STRING,
      quantity: DataTypes.INTEGER,
      totalPrice: DataTypes.INTEGER,
      promo_1: DataTypes.INTEGER,
      promo_2: DataTypes.INTEGER,
      categoryMembershipId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "tblOrderList",
    }
  );
  return tblOrderList;
};
