const Sequelize = require('sequelize');
const { sequelize } = require('../config/database');

const Otp = sequelize.define('otp',{
  _id:{
    type: Sequelize.BIGINT,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  otp:{
    type: Sequelize.STRING,
    allowNull: false
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false
  },
  otpCreatedAt : {
    type: Sequelize.BIGINT,
    defaultValue: Date.now()
  }
});

module.exports= Otp;