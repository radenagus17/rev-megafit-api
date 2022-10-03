'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tblTransactions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      transactionId: {
        type: Sequelize.INTEGER
      },
      salesInvoice: {
        type: Sequelize.STRING
      },
      methodPayment: {
        type: Sequelize.STRING
      },
      memberId: {
        type: Sequelize.INTEGER
      },
      staffId: {
        type: Sequelize.INTEGER
      },
      amount: {
        type: Sequelize.INTEGER
      },
      admPrice: {
        type: Sequelize.INTEGER
      },
      status: {
        type: Sequelize.STRING
      },
      namaRekening: {
        type: Sequelize.STRING
      },
      bankAsal: {
        type: Sequelize.STRING
      },
      keterangan: {
        type: Sequelize.STRING
      },
      paymentDate: {
        type: Sequelize.DATE
      },
      deniedReason: {
        type: Sequelize.STRING
      },
      expiredAt: {
        type: Sequelize.DATE
      },
      namaPemilikKartu: {
        type: Sequelize.STRING
      },
      bankKartu: {
        type: Sequelize.STRING
      },
      bankTujuan: {
        type: Sequelize.STRING
      },
      typeOfCard: {
        type: Sequelize.STRING
      },
      lastDigit: {
        type: Sequelize.STRING
      },
      namaDitransaksi: {
        type: Sequelize.STRING
      },
      invoiceNumber: {
        type: Sequelize.STRING
      },
      totalPayment: {
        type: Sequelize.STRING
      },
      salesId: {
        type: Sequelize.INTEGER
      },
      cashierId: {
        type: Sequelize.INTEGER
      },
      inputMethod: {
        type: Sequelize.STRING
      },
      xendit_url: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('tblTransactions');
  }
};