'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tblHistoryClasses', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER
      },
      classId: {
        type: Sequelize.INTEGER
      },
      catatan: {
        type: Sequelize.STRING
      },
      hasJoined: {
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
    await queryInterface.dropTable('tblHistoryClasses');
  }
};