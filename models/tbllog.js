"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class tblLog extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      tblLog.belongsTo(models.tblUser, { foreignKey: "userId" });
    }
  }
  tblLog.init(
    {
      userId: DataTypes.INTEGER,
      name: DataTypes.STRING,
      url: DataTypes.STRING,
      method: DataTypes.STRING,
      status: DataTypes.INTEGER,
      message: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: "tblLog",
    }
  );
  return tblLog;
};
