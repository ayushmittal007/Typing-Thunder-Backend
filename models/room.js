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
    roomCode : {
        type: Sequelize.STRING,
        defaultValue: shortId.generate
    },
    leaderId : {
        type: Sequelize.BIGINT,
        allowNull: false
    },
    isGameStarted : {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    numberofReadyPeople : {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    numberOfPeople : {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
});

module.exports = Room;