"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class tblClassPt extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      tblClassPt.belongsTo(models.tblUser, { foreignKey: "ptId" });
      tblClassPt.hasMany(models.tblHistoryPT, { foreignKey: "classPtId" });
    }
  }
  tblClassPt.init(
    {
      classPtId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
      },
      ptId: DataTypes.INTEGER,
      time: DataTypes.TIME,
      date: DataTypes.INTEGER,
      week: DataTypes.INTEGER,
      month: DataTypes.INTEGER,
      year: DataTypes.INTEGER,
      linkZoom: DataTypes.STRING,
      isOnline: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "tblClassPt",
    }
  );
  return tblClassPt;
};
