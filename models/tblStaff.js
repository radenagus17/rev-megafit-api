"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class tblStaff extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      tblStaff.belongsTo(models.tblUser, { foreignKey: "userId", as: "staff" });
      tblStaff.belongsTo(models.tblUser, { foreignKey: "evaluatorId1", as: "evaluator1" });
      tblStaff.belongsTo(models.tblUser, { foreignKey: "evaluatorId2", as: "evaluator2" });
      // tblStaffs.hasMany(models.tblTaskPT, { foreignKey: 'ptId' });
      tblStaff.hasMany(models.tblMember, { foreignKey: "ptId" });
      // tblStaffs.hasMany(models.tblTransactions, { foreignKey: 'staffId' });
      // tblStaffs.hasMany(models.tblTransactions, { foreignKey: 'salesId', as: 'sales' });
      // tblStaffs.hasMany(models.tblTransactions, { foreignKey: 'cashierId', as: 'cashier' });
    }
  }
  tblStaff.init(
    {
      staffId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
      },
      userId: DataTypes.INTEGER,
      isPermanent: DataTypes.BOOLEAN,
      available: DataTypes.BOOLEAN,
      cardImage: DataTypes.STRING,
      NIK: DataTypes.STRING,
      canPTOnline: DataTypes.BOOLEAN,
      evaluatorId1: DataTypes.INTEGER,
      evaluatorId2: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "tblStaff",
    }
  );
  return tblStaff;
};
