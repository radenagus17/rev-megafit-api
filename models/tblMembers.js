"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class tblMember extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      tblMember.belongsTo(models.tblUser, { foreignKey: "userId" });
      tblMember.belongsTo(models.tblStaff, { foreignKey: "ptId" });
      tblMember.belongsTo(models.tblPackageMemberships, {
        foreignKey: "packageMembershipId",
        as: "packageMembership",
      });
      tblMember.belongsTo(models.tblPackageMemberships, {
        foreignKey: "packagePTId",
        as: "packagePT",
      });
      tblMember.hasMany(models.tblDataSizeMember, { foreignKey: "memberId" });
      // tblMembers.hasMany(models.tblTransactions, { foreignKey: "memberId" });
      tblMember.hasMany(models.tblTaskPT, { foreignKey: "memberId" });
      tblMember.hasMany(models.tblFoodTracking, { foreignKey: "memberId" });
      // tblMembers.hasMany(models.tblMemberClasses, { foreignKey: "memberId" });
      tblMember.hasMany(models.tblRevenue, { foreignKey: "memberId" });
    }
  }
  tblMember.init(
    {
      memberId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
      },
      userId: DataTypes.INTEGER,
      activeExpired: DataTypes.DATE,
      ptSession: DataTypes.INTEGER,
      cardImage: DataTypes.STRING,
      activeDate: DataTypes.DATE,
      lastCheckin: DataTypes.DATE,
      packageMembershipId: DataTypes.STRING,
      hasConfirmTermAndCondition: DataTypes.BOOLEAN,
      hasSeenSdkFreeze: DataTypes.BOOLEAN,
      isFreeze: DataTypes.BOOLEAN,
      freezeDate: DataTypes.DATE,
      ptId: DataTypes.INTEGER,
      ptSessionOnline: DataTypes.INTEGER,
      isLeave: DataTypes.BOOLEAN,
      leaveDate: DataTypes.DATE,
      packagePTId: DataTypes.STRING,
      isHealthy: DataTypes.BOOLEAN,
      healthExpiredAt: DataTypes.DATE,
      unfreezeDate: DataTypes.DATE,
      activeDatePackagePT: DataTypes.DATE,
      sisaLastPTSession: DataTypes.INTEGER,
      PG_Session: DataTypes.INTEGER,
      leaveStatus: DataTypes.STRING,
      invited_by: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "tblMember",
    }
  );
  return tblMember;
};
