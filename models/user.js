const Sequelize = require('sequelize');
const { sequelize } = require('../config/database');
const shortId = require('shortid');

const User = sequelize.define('user', {
    _id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    username: {
        type: Sequelize.STRING,
        unique: true
    },
    email: {
        type: Sequelize.STRING,
        allowNull: false
    },
    password: {
        type: Sequelize.STRING,
        defaultValue: null
    },
    shortId: {
        type: Sequelize.STRING,
        defaultValue: shortId.generate
    },
    isVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    }
});

module.exports = User;