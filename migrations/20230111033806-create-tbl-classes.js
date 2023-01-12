'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tblClasses', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      ptId: {
        type: Sequelize.INTEGER
      },
      timeIn: {
        type: Sequelize.TIME
      },
      timeOut: {
        type: Sequelize.TIME
      },
      date: {
        type: Sequelize.INTEGER
      },
      week: {
        type: Sequelize.INTEGER
      },
      month: {
        type: Sequelize.INTEGER
      },
      year: {
        type: Sequelize.INTEGER
      },
      linkZoom: {
        type: Sequelize.STRING
      },
      color: {
        type: Sequelize.STRING
      },
      subCategoryMembershipId: {
        type: Sequelize.INTEGER
      },
      limit: {
        type: Sequelize.INTEGER
      },
      isPremium: {
        type: Sequelize.BOOLEAN
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
    await queryInterface.dropTable('tblClasses');
  }
};