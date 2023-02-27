"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class tblCheckinCheckouts extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      tblCheckinCheckouts.belongsTo(models.tblUser, { foreignKey: "userId", as: "member" });
      tblCheckinCheckouts.belongsTo(models.tblUser, { foreignKey: "adminIdCheckin", as: "admin_checkin" });
      tblCheckinCheckouts.belongsTo(models.tblUser, { foreignKey: "adminIdCheckout", as: "admin_checkout" });
    }
  }
  tblCheckinCheckouts.init(
    {
      checkId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      userId: DataTypes.INTEGER,
      adminIdCheckin: DataTypes.INTEGER,
      adminIdCheckout: DataTypes.INTEGER,
      date: DataTypes.DATE,
      checkinTime: DataTypes.TIME,
      checkoutTime: DataTypes.TIME,
      lockerKey: DataTypes.STRING,
      isReservation: DataTypes.BOOLEAN,
      reservationTime: DataTypes.TIME,
      noBottle: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "tblCheckinCheckouts",
    }
  );
  return tblCheckinCheckouts;
};
