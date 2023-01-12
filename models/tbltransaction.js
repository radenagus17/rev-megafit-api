"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class tblTransaction extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      tblTransaction.belongsTo(models.tblMember, { foreignKey: "memberId", as: "member" });
      tblTransaction.belongsTo(models.tblStaff, { foreignKey: "staffId" });
      tblTransaction.belongsTo(models.tblStaff, { foreignKey: "salesId", as: "sales" });
      tblTransaction.belongsTo(models.tblStaff, { foreignKey: "cashierId", as: "cashier" });
      tblTransaction.hasMany(models.tblOrderList, { foreignKey: "transactionId" });
    }
  }
  tblTransaction.init(
    {
      transactionId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      salesInvoice: DataTypes.STRING,
      methodPayment: DataTypes.STRING,
      memberId: DataTypes.INTEGER,
      staffId: DataTypes.INTEGER,
      amount: DataTypes.INTEGER,
      admPrice: DataTypes.INTEGER,
      status: DataTypes.STRING,
      namaRekening: DataTypes.STRING,
      bankAsal: DataTypes.STRING,
      keterangan: DataTypes.STRING,
      paymentDate: DataTypes.DATE,
      deniedReason: DataTypes.STRING,
      expiredAt: DataTypes.DATE,
      namaPemilikKartu: DataTypes.STRING,
      bankKartu: DataTypes.STRING,
      bankTujuan: DataTypes.STRING,
      typeOfCard: DataTypes.STRING,
      lastDigit: DataTypes.STRING,
      namaDitransaksi: DataTypes.STRING,
      invoiceNumber: DataTypes.STRING,
      totalPayment: DataTypes.STRING,
      salesId: DataTypes.INTEGER,
      cashierId: DataTypes.INTEGER,
      inputMethod: DataTypes.STRING,
      xendit_url: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "tblTransaction",
    }
  );
  return tblTransaction;
};
