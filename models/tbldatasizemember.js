"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class tblDataSizeMember extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      tblDataSizeMember.belongsTo(models.tblMember, { foreignKey: "memberId" });
    }
  }
  tblDataSizeMember.init(
    {
      umur: DataTypes.INTEGER,
      height: DataTypes.INTEGER,
      weight: DataTypes.INTEGER,
      triceps: DataTypes.INTEGER,
      dada: DataTypes.INTEGER,
      perut: DataTypes.INTEGER,
      pinggul: DataTypes.INTEGER,
      pinggang: DataTypes.INTEGER,
      paha: DataTypes.INTEGER,
      memberId: DataTypes.INTEGER,
      targetTriceps: DataTypes.INTEGER,
      targetDada: DataTypes.INTEGER,
      targetPerut: DataTypes.INTEGER,
      targetPinggul: DataTypes.INTEGER,
      targetPinggang: DataTypes.INTEGER,
      targetPaha: DataTypes.INTEGER,
      targetWeight: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "tblDataSizeMember",
    }
  );
  return tblDataSizeMember;
};
