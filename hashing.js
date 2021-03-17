const bcrypt = require('bcrypt');

// bcrypt.hash(plaintext, 10, (err, hash) => {

//   console.log(hash);
// });

// bcrypt.compare('', hash)
//   .then((res) => {
//     console.log('promise result', res);
//   });

bcrypt.genSalt(10, (err, salt) => {
  bcrypt.hash('2345', salt, (err, hash) => {

    console.log(hash);

  });
});