"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class tblHistoryClasses extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      tblHistoryClasses.belongsTo(models.tblUser, { foreignKey: "userId" });
      // tblHistoryClasses.belongsTo(models.tblClasses, { foreignKey: 'classId' })
    }
  }
  tblHistoryClasses.init(
    {
      userId: DataTypes.INTEGER,
      classId: DataTypes.INTEGER,
      catatan: DataTypes.STRING,
      hasJoined: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "tblHistoryClasses",
    }
  );
  return tblHistoryClasses;
};
