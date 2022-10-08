const findUserByEmail = (email, users) => {
  for (const userID in users) {
    const userFromDb = users[userID];

    if (userFromDb.email === email) {
      return userFromDb;
    }
  }
  return null;
};

const generateRandomString = function(length) {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

const urlsForUser = function(id, database) {
  let userUrls = {};
  for (const url in database) {
    if (id === database[url].userID) {
      userUrls[url] = database[url];
    }
  }
  return userUrls;
};

module.exports = { findUserByEmail, generateRandomString, urlsForUser };