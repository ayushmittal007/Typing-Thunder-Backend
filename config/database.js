const Sequelize = require('sequelize');
const pg = require('pg');
require('dotenv').config();


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
  
sequelize
.authenticate()
.then(() => {
console.log('Connection to the database has been established successfully.');
})
.catch((err) => {
console.error('Unable to connect to the database:', err);
});

module.exports = {
    sequelize
};