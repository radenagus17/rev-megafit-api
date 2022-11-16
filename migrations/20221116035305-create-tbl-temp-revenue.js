'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tblTempRevenues', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      revenueId: {
        type: Sequelize.INTEGER
      },
      dateActiveMembership: {
        type: Sequelize.DATE
      },
      memberId: {
        type: Sequelize.INTEGER
      },
      price: {
        type: Sequelize.INTEGER
      },
      packageBefore: {
        type: Sequelize.STRING
      },
      packageAfter: {
        type: Sequelize.STRING
      },
      dateActivePT: {
        type: Sequelize.DATE
      },
      packagePT: {
        type: Sequelize.STRING
      },
      times: {
        type: Sequelize.INTEGER
      },
      timesPT: {
        type: Sequelize.INTEGER
      },
      pricePT: {
        type: Sequelize.INTEGER
      },
      PTTerpakai: {
        type: Sequelize.INTEGER
      },
      isDone: {
        type: Sequelize.BOOLEAN
      },
      activeMembershipExpired: {
        type: Sequelize.DATE
      },
      debit: {
        type: Sequelize.INTEGER
      },
      kredit: {
        type: Sequelize.INTEGER
      },
      saldo_member: {
        type: Sequelize.INTEGER
      },
      pending_saldo: {
        type: Sequelize.INTEGER
      },
      status: {
        type: Sequelize.STRING
      },
      keterangan: {
        type: Sequelize.STRING
      },
      is_event: {
        type: Sequelize.BOOLEAN
      },
      last_kredited: {
        type: Sequelize.DATE
      },
      activePtExpired: {
        type: Sequelize.DATE
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
    await queryInterface.dropTable('tblTempRevenues');
  }
};