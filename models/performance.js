const Sequelize = require('sequelize');
const { sequelize } = require('../config/database');

const Performance = sequelize.define('performance', {
    _id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    wpm : {
        type : Sequelize.FLOAT,
        allowNull : false
    },
    accuracy : {
        type : Sequelize.FLOAT,
        allowNull : false
    },
    timing : {
        type : Sequelize.INTEGER,
        allowNull : false
    },
    raw : {
        type : Sequelize.INTEGER,
        allowNull : false
    },
    correct : {
        type : Sequelize.INTEGER,
        allowNull : false
    },
    incorrect : {
        type : Sequelize.INTEGER,
        allowNull : false
    },
    extra : {
        type : Sequelize.INTEGER,
        allowNull : false
    },
    missed : {
        type : Sequelize.INTEGER,
        allowNull : false
    }
});

module.exports = Performance;