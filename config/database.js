const Sequelize = require('sequelize');
const pg = require('pg');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL,{
    logging:false
});

module.exports = {
    sequelize
};