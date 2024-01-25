const Sequelize = require('sequelize');
const { sequelize } = require('../config/database');
const shortId = require('shortid');

const Room = sequelize.define('room', {
    _id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    roomName : {
        type: Sequelize.STRING,
        allowNull: false
    },
    roomCode : {
        type: Sequelize.STRING,
        defaultValue: shortId.generate
    },
    numberOfPeople : {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
});

module.exports = Room;