const express = require("express");
const app = express();
app.set('view engine', 'ejs');
const PORT = 8080;

const morgan = require("morgan");
app.use(morgan('dev'));

const cookieParser = require('cookie-parser');
app.use(cookieParser());

// const bcrypt = require("bcryptjs");
// const hashedPassword = bcrypt.hashSync(password, 10);

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));


// functions
const { findUserByEmail, generateRandomString, urlsForUser } = require('./functions');

// database to hold shortURL and longURL
const urlDatabase = {
  b2xVn2: {
    longURL: "http://www.lighthouselabs.ca",
    userId: "RtU6r2",
  },

  Fsm5xK: {
    longURL: "http://www.google.com",
    userId: "Er54Tg",
  },
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


// main webpage with database listed
app.get("/urls", (req, res) => {
  if (!req.cookies.userId) {
    return res.status(401).send("Please log in to continue");
  }
  const templateVars = { urls: urlsForUser(req.cookies.userId, urlDatabase), userId: req.cookies["userId"]};
  res.render("urls_index", templateVars);
});

// page for creating a new URL
app.get("/urls/new", (req, res) => {
  if (!req.cookies.userId) {
    return res.status(401).send('Please log in or register before creating a new URL');
  } else {
    const templateVars = {userId: req.cookies["userId"]};
    res.render("urls_new", templateVars);
  }
});

// generating random string for URL input
app.post("/urls", (req, res) => {
  if (!req.cookies.userId) {
    res.redirect("/urls");
  } else {
    const shortURL = generateRandomString(6);
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userId: req.cookies["userId"]
    };
    res.redirect(`/urls/${shortURL}`);
  }
});

// page to display the inputed URL and RNG shortURL
app.get("/urls/:id", (req, res) => {
  if (!req.cookies.userId) {
    res.redirect("/urls");
  } else {
    const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id].longURL, userId: req.cookies["userId"]};
    res.render("urls_show", templateVars);
  }
});

// redirect shortURL ----> longURL
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

// adding POST to delete selected URL
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// adding edit route
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect("/urls");
});

// registration page
app.get("/register", (req, res) => {
  if (req.cookies.userId) {
    res.redirect("/urls");
  } else {
    const templateVars = {userId: req.cookies["userId"]};
    res.render("urls_register", templateVars);
  }
});

// post registration page
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).send("Please include email AND password");
  }

  const userFromDb = findUserByEmail(email, users);

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

// login page
app.get("/login", (req, res) => {
  if (req.cookies.userId) {
    res.redirect("/urls");
  } else {
    const templateVars = {userId: req.cookies["userId"]};
    res.render("urls_login", templateVars);
  }
});

// adding username when logging in
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(404).send('Please include email AND password');
  }

  const user = findUserByEmail(email, users);

  if (!user) {
    return res.status(400).send('No user with that email found');
  }

  res.cookie('userId', user.email);

  res.redirect("/urls");
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

