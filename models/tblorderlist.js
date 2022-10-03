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
      tblOrderList.belongsTo(models.tblTransaction, { foreignKey: "transactionId" });
      tblOrderList.belongsTo(models.tblPackageMemberships, { foreignKey: "packageMembershipId" });
      tblOrderList.belongsTo(models.tblCategoryMembership, { foreignKey: "categoryMembershipId" });
    }
  }
  tblOrderList.init(
    {
      transactionId: DataTypes.INTEGER,
      salesInvoice: DataTypes.STRING,
      packageMembershipId: DataTypes.STRING,
      quantity: DataTypes.INTEGER,
      totalPrice: DataTypes.INTEGER,
      categoryMembershipId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "tblOrderList",
    }
  );
  return tblOrderList;
};
