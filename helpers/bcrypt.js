const bcrypt = require("bcryptjs");

module.exports = {
  hashPass(password) {
    let salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
  },
  compare(password, passDb) {
    return bcrypt.compareSync(password, passDb);
  },
};
