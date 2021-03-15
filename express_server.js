const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

function generateRandomString() {
let r = Math.random().toString(36).substring(6);
  return urlDatabase['r'] = longURL;
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
  if (req === undefined) {
    console.log(req.body);
  } // Log the POST request body to the console
  res.send(generateRandomString(req.body));         // Respond with 'Ok' (we will replace this)
});
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL:urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});




app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
