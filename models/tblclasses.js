"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class tblClasses extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      tblClasses.belongsTo(models.tblSubCategoryMembership, { foreignKey: "subCategoryMembershipId" });
      tblClasses.belongsTo(models.tblUser, { foreignKey: "ptId" });
      tblClasses.hasMany(models.tblHistoryClasses, { foreignKey: "classId" });
      tblClasses.hasMany(models.tblMember, { foreignKey: "classId" });
    }
  }
  tblClasses.init(
    {
      ptId: DataTypes.INTEGER,
      timeIn: DataTypes.TIME,
      timeOut: DataTypes.TIME,
      date: DataTypes.INTEGER,
      week: DataTypes.INTEGER,
      month: DataTypes.INTEGER,
      year: DataTypes.INTEGER,
      linkZoom: DataTypes.STRING,
      color: DataTypes.STRING,
      subCategoryMembershipId: DataTypes.INTEGER,
      limit: DataTypes.INTEGER,
      // isPremium: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "tblClasses",
    }
  );
  return tblClasses;
};
