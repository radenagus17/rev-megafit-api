'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tblSubCategoryMemberships', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      subCategoryMembership: {
        type: Sequelize.STRING
      },
      categoryMembershipId: {
        type: Sequelize.INTEGER
      },
      startPromo: {
        type: Sequelize.DATE
      },
      endPromo: {
        type: Sequelize.DATE
      },
      access: {
        type: Sequelize.STRING
      },
      adminFee: {
        type: Sequelize.INTEGER
      },
      activeFlag: {
        type: Sequelize.INTEGER
      },
      isMainPackage: {
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
    await queryInterface.dropTable('tblSubCategoryMemberships');
  }
};