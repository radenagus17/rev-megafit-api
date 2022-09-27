'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tblMembers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      memeberId: {
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER
      },
      activeExpired: {
        type: Sequelize.DATE
      },
      ptSession: {
        type: Sequelize.INTEGER
      },
      cardImage: {
        type: Sequelize.STRING
      },
      activeDate: {
        type: Sequelize.DATE
      },
      lastCheckin: {
        type: Sequelize.DATE
      },
      packageMemberId: {
        type: Sequelize.STRING
      },
      hasConfirmTermAndCondition: {
        type: Sequelize.BOOLEAN
      },
      hasSeenSdkFreeze: {
        type: Sequelize.BOOLEAN
      },
      isFreeze: {
        type: Sequelize.BOOLEAN
      },
      freezeDate: {
        type: Sequelize.DATE
      },
      ptId: {
        type: Sequelize.INTEGER
      },
      ptSessionOnline: {
        type: Sequelize.INTEGER
      },
      isLeave: {
        type: Sequelize.BOOLEAN
      },
      leaveDate: {
        type: Sequelize.DATE
      },
      packagePTId: {
        type: Sequelize.STRING
      },
      isHealthy: {
        type: Sequelize.BOOLEAN
      },
      healthExpiredAt: {
        type: Sequelize.DATE
      },
      unfreezeDate: {
        type: Sequelize.DATE
      },
      activeDatePackagePT: {
        type: Sequelize.DATE
      },
      sisaLastPTSession: {
        type: Sequelize.INTEGER
      },
      PG_Session: {
        type: Sequelize.INTEGER
      },
      leaveStatus: {
        type: Sequelize.STRING
      },
      invited_by: {
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
    await queryInterface.dropTable('tblMembers');
  }
};