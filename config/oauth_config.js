const express = require('express');
const axios = require('axios');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { ErrorHandler } = require('../middlewares/errorHandling');
require('dotenv').config();

router.get('/login', (req, res) => {
  const { CLIENT_ID, REDIRECT_URI } = process.env;
  const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=email%20profile`;
  res.redirect(authUrl);
});

router.get('/callback', async (req, res, next) => {
  console.log('Callback query:', req.query);
  const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } = process.env;
  const { code } = req.query;

  try {
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    });

    const { access_token, id_token } = tokenResponse.data;
    // console.log('Access Token:', access_token);
    // console.log('ID Token:', id_token);
    const decodedToken = jwt.decode(id_token);
    console.log('Decoded Token:', decodedToken);
    const authToken = jwt.sign({ id: decodedToken.sub, unique_identifier: decodedToken.your_custom_claim }, process.env.JWT_ACCESS_KEY);

    res.redirect(`/api/user/get-user?authToken=${authToken}`);
  } catch (error) {
    console.error('Error:', error.message);
    return next(new ErrorHandler(500, 'Internal Server Error'));
  }
});

module.exports = router;