"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class tblPromo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      tblPromo.hasMany(models.tblPromoProduct, {
        foreignKey: "promoId",
      });
      tblPromo.hasMany(models.tblPromoProduct, {
        foreignKey: "promoId",
        as: "products",
      });
      tblPromo.hasMany(models.tblHistoryPromo, {
        foreignKey: "idVoucher",
      });
      tblPromo.hasMany(models.tblOrderList, {
        foreignKey: "promoId",
      });
    }
  }
  tblPromo.init(
    {
      name: DataTypes.STRING,
      code: DataTypes.STRING,
      periodeStart: DataTypes.DATE,
      periodeEnd: DataTypes.DATE,
      typeVoucher: DataTypes.STRING,
      discountMax: DataTypes.INTEGER,
      minimumPurchase: DataTypes.INTEGER,
      usageQuota: DataTypes.INTEGER,
      forAll: DataTypes.BOOLEAN,
      poster: DataTypes.STRING,
      nominal: DataTypes.INTEGER,
      keterangan: DataTypes.STRING,
      canCombine: DataTypes.BOOLEAN,
      isUnlimited: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "tblPromo",
    }
  );
  return tblPromo;
};
