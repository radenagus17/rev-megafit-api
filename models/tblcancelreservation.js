'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class tblCancelReservation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  tblCancelReservation.init({
    memberId: DataTypes.INTEGER,
    reservationDate: DataTypes.DATE,
    reservationTime: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'tblCancelReservation',
  });
  return tblCancelReservation;
};