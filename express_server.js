const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser');
const session = require('express-session');
const moment = require('moment');
const path = require('path');
app.use(cookieParser());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({
  extended: true
}));
app.set("view engine", "ejs");


// generate random Id and short URL
const generateRandomString = () => {
  let r = Math.random().toString(36).substring(6);
  return r;
};


const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  }
};


const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "1234"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

// Create a GET /register endpoint that responds form template.
app.get('/register', (req, res) => {
  const templateVars = {
    userId: req.cookies["userId"],
    email: req.cookies["email"],
    password: req.cookies["password"],
  };
  res.render("register", templateVars);
});

// user register and generate Id
app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    return res.status(400).json({
      msg: 'Please include an email address & password'
    });
  } else
    for (const user in users) {
      const found = Object.values(users[user]).includes(email);
      if (!found) {
        const id = generateRandomString();
        users[id] = {
          userId: id,
          email: email,
          password: password
        };
        res.cookie('userId', id);
        // res.cookie('email', email);
        res.redirect('/urls');
        return users;
      } else if (found) {
        res.status(400).json({
          msg: "Email already exists"
        });
      }
    }
});

// Create a GET /login endpoint that responds with this new login form template.
app.get('/login', (req, res) => {
  const userId = req.cookies["userId"];
  let currentUser = users[userId];
  if (!userId) currentUser = false;
  const templateVars = {
    userId: userId,
    email: currentUser["email"],
    password: req.cookies["password"],
  };
  res.render("login", templateVars);
});

// user login
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  for (const user in users) {
    const found = Object.values(users[user]).includes(email);
    if (found) {
      const currentUser = users[user];
      console.log(currentUser);
      if (currentUser.password === password) {
        const userId = currentUser.id;
        res.cookie('userId', userId);
        res.redirect('/urls');
      } else {
        res.status(403).json({
          msg: "password doesn't match"
        });
      }
    } else {
      res.status(403).json({
        msg: `No user with email ${ req.body.email }`
      });
    }
  }

});

// const checkEmail = (obj, email) => {
//   for (const key in obj) {
//     if (Object.values(obj[key]).includes(email));
//     return true;
//   } return false;
// };

// display a list of urls
app.get("/urls", (req, res) => {
  const userId = req.cookies["userId"];

  let currentUser = users[userId];
  // console.log(currentUser);
  if (!userId) currentUser = false;
  const templateVars = {
    email: currentUser["email"],
    userId: userId,
    urls: urlDatabase,
    user: currentUser
  };
  res.render("urls_index", templateVars);
});


// create a new url
app.get("/urls/new", (req, res) => {
  const userId = req.cookies["userId"];
  let currentUser = users[userId];
  if (!userId) res.redirect('/login');
  // console.log(currentUser["email"]);
  // console.log(currentUser);
  const templateVars = {
    email: currentUser["email"],
    userId: userId,
    urls: urlDatabase,
    user: currentUser
  };

  res.render("urls_new", templateVars);
});



// generate url and show user
app.post("/urls", (req, res) => {
  // check the longURL is inside the urlDatabase
  const longURL = req.body.longURL.includes("http") ? longURL : `http://${ req.body.longURL }`;
  //if not, generate one to add to the urlDatabase, and redirect to (`/urls/:${ shortURL }`);
  if (!Object.values(urlDatabase).includes(longURL)) {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = longURL;
    res.redirect(`/urls/${ shortURL }`);
  } else
    for (const key in urlDatabase) {
      //if longURL is in the urlDatabase, go to add.get(/urls/:shortURL)
      if (urlDatabase[key] === longURL) {
        res.redirect(`/urls/${ key }`);
      }
    }
});



//display url
app.get("/urls/:shortURL", (req, res) => {
  const userId = req.cookies["userId"];
  let currentUser = users[userId];
  if (!userId) currentUser = false;
  const email = currentUser["email"];
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[req.params.shortURL].longURL;
  const templateVars = {
    userId: userId,
    email: email,
    shortURL: shortURL,
    longURL: longURL
  };
  urlDatabase[shortURL] = {
    longURL: longURL,
    userId: userId
  };
  console.log('urlDatabase: ', urlDatabase);
  res.render("urls_show", templateVars);
});

// delete an url
app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect(`/urls`);
});


// edit the long url
app.post("/urls/:id", (req, res) => {
  const longURL = req.body.longURL;
  const id = req.params.id;
  urlDatabase[id] = longURL;
  // console.log("longURL: " + longURL);
  // console.log("id: " + id);
  // console.log("urlDatabase: " + urlDatabase);
  res.redirect(`/urls/${ id }`);
});

// go to the website page
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  // console.log("shortURL: " + shortURL);
  const longURL = urlDatabase[shortURL].longURL;
  // console.log("longURL: " + longURL);
  res.redirect(longURL.includes("http") ? longURL : `http://${longURL}`);
  return;
});


// user logout
app.post("/logout", (req, res) => {
  console.log(req.body);
  res.clearCookie('userId', req.body.userId);
  res.redirect('/urls');
});




app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});