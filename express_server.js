const express = require("express");
const morgan = require('morgan');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const methodOverride = require('method-override');
const mongoose = require('mongoose');
require('dotenv/config');

const app = express();
const PORT = process.env.PORT || 8080;
const {
  getUserByEmail
} = require('./helpers');

app.use(express.json());
app.use(morgan('dev'));
app.use(express.static('public'));
app.use(express.urlencoded({
  extended: true
}));
app.use(cookieSession({
  name: 'session',
  keys: ['anything', 'you want']
}));
app.use(methodOverride('_method'));

mongoose.connect("process.env.DB_CONNECTION", {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true
  },
  () => {
    console.log('connected to DB');
  });

app.set("view engine", "ejs");


// generate random Id and short URL
const generateRandomString = () => Math.random().toString(36).substring(6);

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
      // res.cookie('userId', id);
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
  // for (const id in users) {
  //   if (users[id].email === email) {
  //     currentUser = users[id];
  //     break;
  //   }
  // }
  const userId = getUserByEmail(email, users);
  currentUser = users[userId];
  if (!userId) {
    return res.status(403).send(`No user with email ${ req.body.email }`);
  }
  // compare passwords
  bcrypt.compare(password, currentUser.password, (err, result) => {
    // console.log("result", result);
    if (result) {
      // res.cookie('userId', userId);
      req.session.userId = userId;
      res.redirect('/urls');
    } else {
      res.status(403).json({
        msg: "password doesn't match"
      });
    }
  });
});



// filter the list by userId
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
  let currentUser = users[userId];
  // console.log(currentUser);
  if (!userId) return res.status(403).send(`Please login first`);
  const templateVars = {
    email: currentUser["email"],
    userId: userId,
    urls: urlsForUser(userId),
    user: currentUser,
  };
  res.render("urls_index", templateVars);
});


// generate url and show user
app.post("/urls", (req, res) => {
  // check the longURL is inside the urlDatabase
  const longURL = req.body.longURL.includes("http") ? longURL : `http://${ req.body.longURL }`;
  //if not, generate one to add to the urlDatabase, and redirect to (`/urls/:${ shortURL }`);
  console.log(req.body.longURL, req.session.userId);

  if (!Object.values(urlDatabase).includes(longURL)) {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      longURL: longURL,
      userID: req.session.userId
    };
    console.log(urlDatabase);
    res.redirect(`/urls/${ shortURL }`);
  } else
    for (const key in urlDatabase) {
      //if longURL is in the urlDatabase, go to add.get(/urls/:shortURL)
      if (urlDatabase[key] === longURL) {
        res.redirect(`/urls/${ key }`);
      }
    }
});

// create a new url
app.get("/urls/new", (req, res) => {
  const userId = req.session.userId;
  // console.log(users);
  let currentUser = users[userId];
  if (!userId) res.redirect('/login');
  // console.log(currentUser);
  // console.log(currentUser.email);
  const templateVars = {
    email: currentUser["email"],
    userId: userId,
    urls: urlDatabase,
    user: currentUser
  };
  // res.cookie('userId', userId);
  req.session.userId = userId;
  res.render("urls_new", templateVars);
});

//display url
app.get("/urls/:shortURL", (req, res) => {
  const userId = req.session.userId;
  let currentUser = users[userId];
  if (!userId) {
    res.redirect('/login');
  }
  const email = currentUser["email"];
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  const id = req.params.shortURL;
  console.log("id: " + id);
  const list = urlsForUser(userId);
  if (!list[req.params.shortURL]) {
    return res.status(403).send(`You don't own the URL`);
  }
  const templateVars = {
    userId: userId,
    email: email,
    shortURL: shortURL,
    longURL: longURL,
    user: users[req.session.userId]
  };
  urlDatabase[shortURL] = {
    longURL: longURL,
    userID: userId
  };
  // console.log('urlDatabase: ', urlDatabase);
  res.render("urls_show", templateVars);
});

// delete an url
app.delete('/urls/:shortURL', (req, res) => {
  const userId = req.session.userId;
  if (userId) {
    const shortURL = req.params.shortURL;
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
  console.log("id: " + id);
  const list = urlsForUser(userId);
  if (!list[req.params.id]) return res.status(403).send(`You don't own the URL`);
  urlDatabase[id].longURL = longURL;
  res.redirect(`/urls/${ id }`);
  // console.log("longURL: " + longURL);
  // console.log("urlDatabase: " + urlDatabase);
});

// go to the website page
// I didn't add the part that if URL for the given ID does not exist, returns HTML with a relevant error message since you want the users to share the links.
app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  // console.log("shortURL: " + shortURL);
  const longURL = urlDatabase[shortURL].longURL;
  // console.log("longURL: " + longURL);
  res.redirect(longURL.includes("http") ? longURL : `http://${longURL}`);
  return;
});


// user logout
app.post("/logout", (req, res) => {
  req.session = null;
  // I change this to redirect to login because it makes more sense.
  res.redirect('/login');
});


app.get("/404", (req, res) => {
  res.render('404');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});