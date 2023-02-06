"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class tblMemberClasses extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      tblMemberClasses.belongsTo(models.tblMember, { foreignKey: "memberId" });
      tblMemberClasses.belongsTo(models.tblSubCategoryMembership, { foreignKey: "subCategoryMembershipId" });
    }
  }
  tblMemberClasses.init(
    {
      memberId: DataTypes.INTEGER,
      subCategoryMembershipId: DataTypes.INTEGER,
      times: DataTypes.INTEGER,
      expired: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "tblMemberClasses",
    }
  );
  return tblMemberClasses;
};
