const { assert } = require('chai');

const { findUserByEmail } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = findUserByEmail("user@example.com", testUsers);
    assert.equal(user, testUsers.userRandomID);
  });

  it('should return undefined when looking for a non-existent email', function() {
    const user = findUserByEmail('idontexist@fake.com', testUsers);
    assert.equal(user, undefined);
  });
});

