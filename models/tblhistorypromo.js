"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class tblHistoryPromo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      tblHistoryPromo.belongsTo(models.tblPromo, {
        foreignKey: "idVoucher",
        as: "promo",
      });
      tblHistoryPromo.belongsTo(models.tblTransaction, {
        foreignKey: "transaction",
      });
    }
  }
  tblHistoryPromo.init(
    {
      memberId: DataTypes.INTEGER,
      idVoucher: DataTypes.INTEGER,
      claimDate: DataTypes.DATE,
      keterangan: DataTypes.STRING,
      discount: DataTypes.STRING,
      transaction: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "tblHistoryPromo",
    }
  );
  return tblHistoryPromo;
};
