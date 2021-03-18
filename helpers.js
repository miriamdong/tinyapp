const getUserByEmail = function(email, database) {
  let user = {};
  for (const key in database) {
    const found = Object.values(database[key]).includes(email);
    if (found) {
      user[key] = database[key];
      return key;
    }
  }
  return false;
};



module.exports = {
  getUserByEmail
};