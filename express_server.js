const express = require("express");
const morgan = require('morgan');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const methodOverride = require('method-override');
// const mongoose = require('mongoose');
// require('dotenv/config');

const app = express();
const PORT = process.env.PORT || 8080;
const {
  getUserByEmail
} = require('./helpers');

app.use(express.json());
app.use(morgan('dev'));
app.use(express.urlencoded({
  extended: true
}));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));
app.use(methodOverride('_method'));


app.set("view engine", "ejs");

// generate random Id and short URL
const generateRandomString = (length = 6) => Math.random().toString(20).substr(2, length);

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
    clickCount: 0
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "pbux6n",
    clickCount: 0
  }
};


const users = {
  "aJ48lW": {
    id: "aJ48lW",
    email: "user@example.com",
    password: "$2b$10$vPAx.Vzo/nQHjdfkxluUfeI6JttCb/ybtnQYDl0EBfgthjaSBhWy6"
  },
  "pbux6n": {
    id: "pbux6n",
    email: "user2@example.com",
    password: "$2b$10$NDmEPwMGkP5H.xfU266s.eAVeNToAZx5QcxefBvVPh9N83IOksnBO"
  }
};

// Routes
app.get('/', (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    res.redirect('/login');
  }
  res.redirect('/urls');
});

// Create a GET /register endpoint that responds form template.
app.get('/register', (req, res) => {
  const templateVars = {
    user: users[req.session.userId]
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
  }
  for (const id in users) {
    const found = users[id].email === email;
    if (found) {
      return res.status(400).json({
        msg: "Email already exists"
      });
    }
  }
  const id = generateRandomString();
  // hash the password
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, (err, hash) => {
      users[id] = {
        userId: id,
        email: email,
        password: hash
      };

      req.session.userId = id;
      res.redirect('/urls');
    });
  });
});

// Create a GET /login endpoint that responds with this new login form template.
app.get('/login', (req, res) => {
  const templateVars = {
    user: users[req.session.userId]
  };
  res.render("login", templateVars);
});

// user login (submit handler)
app.patch('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  let currentUser;

  const userId = getUserByEmail(email, users);
  currentUser = users[userId];
  if (!userId) {
    return res.status(403).send(`No user with email ${ req.body.email }`);
  }
  // compare passwords
  bcrypt.compare(password, currentUser.password, (err, result) => {
    if (!result) {
      return res.status(403).send("password doesn't match");
    }
    req.session.userId = userId;
    res.redirect('/urls');
  });
});


// Helper function to filter the list by userId
const urlsForUser = (id) => {
  let urls = {};
  for (const key in urlDatabase) {
    if (urlDatabase[key].userID === id) {
      urls[key] = urlDatabase[key];
    }
  }
  return urls;
};

// display a list of urls
app.get("/urls", (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.status(403).send(`Please login first`);
  }

  let user = users[userId];
  console.log("user", user, userId);
  if (!user) {
    return res.status(403).send(`bad user`);
  }

  const urls = urlsForUser(userId);

  const templateVars = {
    urls,
    user
  };

  res.render("urls_index", templateVars);
});

// Helper function to get shortURL from user's list
const getShortURL = (userId, longURL) => {
  const list = urlsForUser(userId);
  for (const shortURL in list) {
    //if longURL is in the urlDatabase, go to add.get(/urls/:shortURL)
    console.log("shortURL: " + shortURL, urlDatabase[shortURL]);
    if (list[shortURL].longURL === longURL) {
      return shortURL;
    }
  }
};

// generate url and show user
app.post("/urls", (req, res) => {

  const userID = req.session.userId;
  if (!userID) {
    return res.status(403).send(`Please login first`);
  }

  let user = users[userID];
  if (!user) {
    return res.status(403).send(`bad user`);
  }

  const longURL = req.body.longURL;
  if (!longURL) {
    return res.status(404).send('Bad URL');
  }

  // check the longURL is inside the user's urlDatabase
  let shortURL = getShortURL(userID, longURL);

  if (shortURL) {
    res.redirect(`/urls/${shortURL}`);
    return;
  }

  //if not, generate one to add to the urlDatabase, and redirect to (`/urls/:${ shortURL }`);
  shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL,
    userID
  };
  res.redirect(`/urls/${ shortURL }`);
});

// create a new url
app.get("/urls/new", (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    res.redirect('/login');
  }

  let user = users[userId];
  const templateVars = {
    userId,
    user,
    urls: urlDatabase,
  };

  req.session.userId = userId;
  res.render("urls_new", templateVars);
});

//display url
app.get("/urls/:id", (req, res) => {
  const userId = req.session.userId;
  let user = users[userId];
  if (!userId) {
    res.redirect('/login');
  }
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL].longURL;
  const list = urlsForUser(userId);
  if (!list[shortURL]) {
    return res.status(403).send(`You don't own the URL`);
  }
  const templateVars = {
    userId,
    shortURL,
    longURL,
    user
  };
  urlDatabase[shortURL] = {
    longURL: longURL,
    userID: userId
  };
  res.render("urls_show", templateVars);
});

// delete an url
app.delete('/urls/:id', (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    res.redirect('/login');
  }
  const shortURL = req.params.id;
  const list = urlsForUser(userId);

  if (!list[shortURL]) {
    return res.status(403).send(`You don't own the URL`);
  }

  if (userId) {
    const shortURL = req.params.id;
    delete urlDatabase[shortURL];
  }
  res.redirect(`/urls`);
});


// edit the long url
app.post("/urls/:id", (req, res) => {
  const longURL = req.body.longURL;
  const userId = req.session.userId;
  if (!userId) {
    return res.status(403).send(`Please login first`);
  }
  const id = req.params.id;
  const list = urlsForUser(userId);
  if (!list[req.params.id]) return res.status(403).send(`You don't own the URL`);
  urlDatabase[id].longURL = longURL;
  res.redirect(`/urls/${ id }`);
});

// go to the website page
app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL].longURL;
  if (!longURL) {
    return res.status(400).send("URL doesn't exist");
  }

  // send them somewhere just to be safe
  return res.redirect(longURL.includes("http") ? longURL : `http://${longURL}`);

});


// user logout
app.post("/logout", (req, res) => {
  req.session = null;
  // I think this should redirect to the login page which makes more sense.
  res.redirect('/');
});


app.get("/404", (req, res) => {
  res.render('404');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});