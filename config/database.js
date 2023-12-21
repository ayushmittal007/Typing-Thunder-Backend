const Sequelize = require('sequelize');
const pg = require('pg');
require('dotenv').config();

// const sequelize = new Sequelize(process.env.,{
    // logging:false
// });

// const sequelize = new Sequelize(process.env.DATABASE_URL,{
    // logging:false
// });

const sequelize = new Sequelize(
    process.env.DATABASE_NAME,
    process.env.DATABASE_USER,
    process.env.DATABASE_PASSWORD,
    {
      host: process.env.DATABASE_HOST,
      dialect: 'postgres',
      logging: false,
    }
  );
  
module.exports = {
    sequelize
};