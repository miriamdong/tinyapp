const express = require("express");
const app = express();
const bodyParser = require('body-parser');
// const {
//   request
// } = require("express");

const PORT = 8080; // default port 8080
app.use(bodyParser.urlencoded({
  extended: true
}));
// eslint-disable-next-line func-style
function generateRandomString() {
  let r = Math.random().toString(36).substring(6);
  return r;
}

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};


app.set("view engine", "ejs");

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});


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


app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect(`/urls`);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]
  };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  const longURL = req.body.longURL;
  const id = req.params.id;
  urlDatabase[id] = longURL;
});

app.get("/u/:shortURL", (req, res) => {
  if (req.params.shortURL) {
    const longURL = urlDatabase[req.params.shortURL];
    // console.log("longURL: " + longURL);
    res.redirect(longURL.includes("http") ? longURL : `http://${longURL}`);
    return;
  }
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});