const express = require("express");
const app = express();
const morgan = require("morgan");
const cookieParser = require('cookie-parser');
const PORT = 8080;


app.set('view engine', 'ejs');

app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// database to hold shortURL and longURL
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// database to hold usersID
const users = {
  userRandomID: {
    id: "RtU6r2",
    email: "test1@test.com",
    password: "test1"
  },
  user2RandomID: {
    id: "Er54Tg",
    email: "test2@test.com",
    password: "test2"
  },
};

// findUserByEmail funtion goes here for now
const findUserByEmail = (email) => {
  for (const userID in users) {
    const userFromDb = users[userID];

    if (userFromDb.email === email) {
      return userFromDb;
    }
  }
  return null;
};

// generateRandomString function goes here for now
const generateRandomString = function(length) {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

// main webpage with database listed
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, userId: req.cookies["userId"]};
  res.render("urls_index", templateVars);
});

// page for creating a new URL
app.get("/urls/new", (req, res) => {
  const templateVars = {userId: req.cookies["userId"]};
  res.render("urls_new", templateVars);
});

// generating random string for URL input
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString(6);
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

// page to display the inputed URL and RNG shortURL
app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], userId: req.cookies["userId"]};
  res.render("urls_show", templateVars);
});

// redirect shortURL ----> longURL
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

// adding POST to delete selected URL
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// adding edit route
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls");
});

// login page
app.get("/login", (req, res) => {
  const templateVars = {userId: req.cookies["userId"]};
  res.render("urls_login", templateVars);
});

// adding username when logging in
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(404).send('Please include email AND password');
  }

  const user = findUserByEmail(email);

  if (!user) {
    return res.status(400).send('No user with that email found');
  }

  res.cookie('userId', user.email);

  res.redirect("/urls");
});


// registration page
app.get("/register", (req, res) => {
  const templateVars = {userId: req.cookies["userId"]};
  res.render("urls_register", templateVars);
});

// post registration page
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).send("Please include email AND password");
  }

  const userFromDb = findUserByEmail(email);

  if (userFromDb) {
    return res.status(400).send("email is already in use");
  }

  const id = generateRandomString(6);

  const user = {
    id,
    email,
    password
  };

  users[id] = user;
  console.log(users);

  res.cookie('user_Id', user.id);

  res.redirect('/urls');
});

// directing user back to urls with no username when clicking logout
app.post("/logout", (req, res) => {
  res.clearCookie("userId");
  res.redirect("/urls");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

