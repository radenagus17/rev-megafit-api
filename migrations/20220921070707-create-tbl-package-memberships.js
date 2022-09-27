'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tblPackageMemberships', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      packageMembershipId: {
        type: Sequelize.STRING
      },
      package: {
        type: Sequelize.STRING
      },
      subCategoryMembershipId: {
        type: Sequelize.INTEGER
      },
      times: {
        type: Sequelize.INTEGER
      },
      price: {
        type: Sequelize.INTEGER
      },
      activeMember: {
        type: Sequelize.INTEGER
      },
      sessionPtHours: {
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
    await queryInterface.dropTable('tblPackageMemberships');
  }
};