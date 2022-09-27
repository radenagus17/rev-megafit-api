'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tblDataSizeMembers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      umur: {
        type: Sequelize.INTEGER
      },
      height: {
        type: Sequelize.INTEGER
      },
      weight: {
        type: Sequelize.INTEGER
      },
      triceps: {
        type: Sequelize.INTEGER
      },
      dada: {
        type: Sequelize.INTEGER
      },
      perut: {
        type: Sequelize.INTEGER
      },
      pinggul: {
        type: Sequelize.INTEGER
      },
      pinggang: {
        type: Sequelize.INTEGER
      },
      paha: {
        type: Sequelize.INTEGER
      },
      memberId: {
        type: Sequelize.INTEGER
      },
      targetTriceps: {
        type: Sequelize.INTEGER
      },
      targetDada: {
        type: Sequelize.INTEGER
      },
      targetPerut: {
        type: Sequelize.INTEGER
      },
      targetPinggul: {
        type: Sequelize.INTEGER
      },
      targetPinggang: {
        type: Sequelize.INTEGER
      },
      targetPaha: {
        type: Sequelize.INTEGER
      },
      targetWeight: {
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
    await queryInterface.dropTable('tblDataSizeMembers');
  }
};