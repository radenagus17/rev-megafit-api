'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class tblPackageClasses extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      tblPackageClasses.belongsTo(models.tblMember, { foreignKey: "memberId" });
      tblPackageClasses.belongsTo(models.tblSubCategoryMembership, { foreignKey: "subCategoryMembershipId" });
    }
  }
  tblPackageClasses.init({
    memberId: DataTypes.INTEGER,
    subCategoryMembershipId: DataTypes.INTEGER,
    activeDate: DataTypes.DATE,
    expiredDate: DataTypes.DATE,
    classSession: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'tblPackageClasses',
  });
  return tblPackageClasses;
};