"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class tblHistoryPT extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      tblHistoryPT.belongsTo(models.tblUser, { foreignKey: "userId" });
      tblHistoryPT.belongsTo(models.tblClassPt, { foreignKey: "classPtId" });
      tblHistoryPT.belongsTo(models.tblRevenue, { foreignKey: "revenueId" });
    }
  }
  tblHistoryPT.init(
    {
      userId: DataTypes.INTEGER,
      classPtId: DataTypes.INTEGER,
      catatan: DataTypes.STRING,
      hasJoined: DataTypes.INTEGER,
      PTCommission: DataTypes.INTEGER,
      transactionId: DataTypes.INTEGER,
      revenueId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "tblHistoryPT",
    }
  );
  return tblHistoryPT;
};
