"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class tblUser extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      tblUser.belongsTo(models.tblRole, { foreignKey: "roleId" });

      tblUser.hasOne(models.tblStaff, { foreignKey: "userId", as: "staff" });
      tblUser.hasOne(models.tblStaff, {
        foreignKey: "evaluatorId1",
        as: "evaluator1",
      });
      tblUser.hasOne(models.tblStaff, {
        foreignKey: "evaluatorId2",
        as: "evaluator2",
      });
      tblUser.hasOne(models.tblMember, { foreignKey: "userId" });

      // tblUsers.hasMany(models.tblAttendances, { foreignKey: "userId" });
      // tblUsers.hasMany(models.tblClassPts, { foreignKey: "ptId" });
      // tblUsers.hasMany(models.tblCardPayments, { foreignKey: "userId" });
      // tblUsers.hasMany(models.tblPrivileges, { foreignKey: "userId" });
      tblUser.hasMany(models.tblCheckinCheckouts, {
        foreignKey: "userId",
        as: "member",
      });
      tblUser.hasMany(models.tblCheckinCheckouts, {
        foreignKey: "adminIdCheckin",
        as: "admin_checkin",
      });
      tblUser.hasMany(models.tblCheckinCheckouts, {
        foreignKey: "adminIdCheckout",
        as: "admin_checkout",
      });
      // tblUsers.hasMany(models.tblTransactions, { foreignKey: "memberId" });
      // tblUsers.hasMany(models.tblTransactions, { foreignKey: "staffId" });
      // tblUsers.hasMany(models.tblHistoryPTs, { foreignKey: "userId" });
      tblUser.hasMany(models.tblLog, { foreignKey: "userId" });
      // tblUsers.hasMany(models.tblClasses, { foreignKey: "ptId" });
      // tblUsers.hasMany(models.tblHistoryClasses, { foreignKey: "userId" });
    }
  }
  tblUser.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
      },
      username: DataTypes.STRING,
      password: DataTypes.STRING,
      fullname: DataTypes.STRING,
      nickname: DataTypes.STRING,
      avatar: DataTypes.STRING,
      noKtp: DataTypes.STRING,
      dateOfBirth: DataTypes.DATE,
      email: DataTypes.STRING,
      phone: DataTypes.STRING,
      gender: DataTypes.STRING,
      igAccount: DataTypes.STRING,
      roleId: DataTypes.INTEGER,
      haveWhatsapp: DataTypes.BOOLEAN,
      flagActive: DataTypes.BOOLEAN,
      agreePromo: DataTypes.BOOLEAN,
      isDataConflict: DataTypes.BOOLEAN,
      first_login: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "tblUser",
    }
  );
  return tblUser;
};
