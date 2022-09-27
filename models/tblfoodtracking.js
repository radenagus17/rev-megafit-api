"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class tblFoodTracking extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      tblFoodTracking.belongsTo(models.tblMember, { foreignKey: "memberId" });
    }
  }
  tblFoodTracking.init(
    {
      day: DataTypes.INTEGER,
      week: DataTypes.INTEGER,
      year: DataTypes.INTEGER,
      food: DataTypes.STRING,
      foodQty: DataTypes.STRING,
      memberId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "tblFoodTracking",
    }
  );
  return tblFoodTracking;
};
