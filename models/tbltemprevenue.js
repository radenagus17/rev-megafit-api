'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class tblTempRevenue extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  tblTempRevenue.init({
    revenueId: DataTypes.INTEGER,
    dateActiveMembership: DataTypes.DATE,
    memberId: DataTypes.INTEGER,
    price: DataTypes.INTEGER,
    packageBefore: DataTypes.STRING,
    packageAfter: DataTypes.STRING,
    dateActivePT: DataTypes.DATE,
    packagePT: DataTypes.STRING,
    times: DataTypes.INTEGER,
    timesPT: DataTypes.INTEGER,
    pricePT: DataTypes.INTEGER,
    PTTerpakai: DataTypes.INTEGER,
    isDone: DataTypes.BOOLEAN,
    activeMembershipExpired: DataTypes.DATE,
    debit: DataTypes.INTEGER,
    kredit: DataTypes.INTEGER,
    saldo_member: DataTypes.INTEGER,
    pending_saldo: DataTypes.INTEGER,
    status: DataTypes.STRING,
    keterangan: DataTypes.STRING,
    is_event: DataTypes.BOOLEAN,
    last_kredited: DataTypes.DATE,
    activePtExpired: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'tblTempRevenue',
  });
  return tblTempRevenue;
};