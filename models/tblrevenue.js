"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class tblRevenue extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      tblRevenue.belongsTo(models.tblMember, { foreignKey: "memberId" });
      // tblRevenue.hasMany(models.tblHistoryPTs, {foreignKey: 'revenueId'});
    }
  }
  tblRevenue.init(
    {
      memberId: DataTypes.INTEGER,
      dateActiveMembership: DataTypes.DATE,
      activeMembershipExpired: DataTypes.DATE,
      keterangan: DataTypes.STRING,
      status: DataTypes.STRING,
      packageBefore: DataTypes.STRING,
      packageAfter: DataTypes.STRING,
      times: DataTypes.INTEGER,
      debit: DataTypes.INTEGER,
      kredit: DataTypes.INTEGER,
      saldo_member: DataTypes.INTEGER,
      pending_saldo: DataTypes.INTEGER,
      price: DataTypes.INTEGER,
      is_event: DataTypes.INTEGER,
      last_kredited: DataTypes.DATE,
      dateActivePT: DataTypes.DATE,
      activePtExpired: DataTypes.DATE,
      packagePT: DataTypes.STRING,
      timesPT: DataTypes.INTEGER,
      PTTerpakai: DataTypes.INTEGER,
      isDone: DataTypes.INTEGER,
      pricePT: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "tblRevenue",
    }
  );
  return tblRevenue;
};
