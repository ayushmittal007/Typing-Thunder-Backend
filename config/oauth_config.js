const axios = require('axios');
require('dotenv').config();

const rootURL = process.env.ROOT_URL;

async function getGoogleOauthToken({ code }) {
  const options = {
    code,
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    redirect_uri: process.env.REDIRECT_URI,
    grant_type: 'authorization_code',
  };

  try {
    const { data } = await axios.post(rootURL, new URLSearchParams(options), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return data;
  } catch (err) {
    console.log('Failed to fetch Google OAuth Tokens');
    throw new Error(err);
  }
}

async function getGoogleUser({ id_token, access_token }) {
  try {
    const { data } = await axios.get(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
      {
        headers: {
          Authorization: `Bearer ${id_token}`,
        },
      }
    );
    return data;
  } catch (err) {
    console.log(err);
    throw new Error(err);
  }
}

module.exports = { 
  getGoogleOauthToken,
  getGoogleUser
};