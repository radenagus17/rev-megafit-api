'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class tblHistoryRemain extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      tblHistoryRemain.belongsTo(models.tblMember, { foreignKey: "memberId" });
    }
  }
  tblHistoryRemain.init({
    memberId: DataTypes.INTEGER,
    idClass: DataTypes.INTEGER,
    sisaKelasPremium: DataTypes.INTEGER,
    sisaKelasBasic: DataTypes.INTEGER,
    sisaPT: DataTypes.INTEGER,
    expiredDate: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'tblHistoryRemain',
  });
  return tblHistoryRemain;
};