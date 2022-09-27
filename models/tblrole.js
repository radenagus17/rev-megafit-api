"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class tblRole extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      tblRole.hasMany(models.tblUser, { foreignKey: "roleId" });
    }
  }
  tblRole.init(
    {
      roleId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
      },
      role: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "tblRole",
    }
  );
  return tblRole;
};
