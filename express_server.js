const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const { request } = require("express");

const PORT = 8080; // default port 8080
app.use(bodyParser.urlencoded({ extended: true }));
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
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});


app.post("/urls", (req, res) => {
// check the longURL is inside the urlDatabase
  // const urlData = req.params.url;
  const longURL = req.body.longURL;
  // console.log("longURL: " + longURL, "urlDatabase: " + urlDatabase);

  //if longURL is in the urlDatabase, go to add.get(/urls/:shortURL)
  for (const key in urlDatabase) {
    // console.log("urlDatabase[key]: " + urlDatabase[key]);
    console.log("s1: ", key, "urlDatabase[key]: " + urlDatabase[key]);
    if (urlDatabase[key] === longURL) {

      res.redirect(`/urls/${ key }`);
      //if not, generateRandomString as shortURL, and add to the urlDatabase and redirect res.redirect(`/urls/:${ shortURL }`);
    }
  }

  const shortURL = generateRandomString();
  urlDatabase[shortURL] = longURL;
  console.log("urlDatabase: ", urlDatabase);
  res.redirect(`/urls/${ shortURL }`);

});


app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  if (req.params.shortURL) {
    const longURL = urlDatabase[req.params.shortURL];
    // console.log("p: ", req.params);
    console.log("longURL: " + longURL);
    // console.log("urlDatabase: ", urlDatabase);
    // console.log("shortURL: " + req.params.shortURL);
    // console.log("here");
    res.redirect(longURL.includes("http") ? longURL : `http://${longURL}`);
    return;
  }
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
