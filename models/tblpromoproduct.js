"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class tblPromoProduct extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      tblPromoProduct.belongsTo(models.tblPackageMemberships, {
        foreignKey: "productId",
      });
      tblPromoProduct.belongsTo(models.tblPromo, {
        foreignKey: "promoId",
      });
    }
  }
  tblPromoProduct.init(
    {
      promoId: DataTypes.INTEGER,
      productId: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "tblPromoProduct",
    }
  );
  return tblPromoProduct;
};
