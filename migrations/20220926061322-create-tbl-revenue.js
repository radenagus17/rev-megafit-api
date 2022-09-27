'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tblRevenues', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      memberId: {
        type: Sequelize.INTEGER
      },
      dateActiveMembership: {
        type: Sequelize.DATE
      },
      activeMembershipExpired: {
        type: Sequelize.DATE
      },
      keterangan: {
        type: Sequelize.STRING
      },
      status: {
        type: Sequelize.STRING
      },
      packageBefore: {
        type: Sequelize.STRING
      },
      packageAfter: {
        type: Sequelize.STRING
      },
      times: {
        type: Sequelize.INTEGER
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
      price: {
        type: Sequelize.INTEGER
      },
      is_event: {
        type: Sequelize.INTEGER
      },
      last_kredited: {
        type: Sequelize.DATE
      },
      dateActivePT: {
        type: Sequelize.DATE
      },
      activePtExpired: {
        type: Sequelize.DATE
      },
      packagePT: {
        type: Sequelize.STRING
      },
      timesPT: {
        type: Sequelize.INTEGER
      },
      PTTerpakai: {
        type: Sequelize.INTEGER
      },
      isDone: {
        type: Sequelize.INTEGER
      },
      pricePT: {
        type: Sequelize.INTEGER
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
    await queryInterface.dropTable('tblRevenues');
  }
};