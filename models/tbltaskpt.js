"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class tblTaskPT extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      tblTaskPT.belongsTo(models.tblMember, { foreignKey: "memberId" });
    }
  }
  tblTaskPT.init(
    {
      day: DataTypes.INTEGER,
      week: DataTypes.INTEGER,
      year: DataTypes.INTEGER,
      task: DataTypes.STRING,
      taskDone: DataTypes.BOOLEAN,
      ptId: DataTypes.INTEGER,
      memberId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "tblTaskPT",
    }
  );
  return tblTaskPT;
};
