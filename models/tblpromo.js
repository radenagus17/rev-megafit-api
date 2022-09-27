'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class tblPromo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  tblPromo.init({
    name: DataTypes.STRING,
    poster: DataTypes.STRING,
    phone: DataTypes.STRING,
    address: DataTypes.STRING,
    promo: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'tblPromo',
  });
  return tblPromo;
};