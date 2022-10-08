const express = require("express");
const morgan = require("morgan");
const cookieSession = require('cookie-session');
const app = express();
const PORT = 8080;
const bcrypt = require("bcryptjs");
const salt = bcrypt.genSaltSync(10);

app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['lsbosufa']
}));

app.set('view engine', 'ejs');

// helper functions
const { findUserByEmail, generateRandomString, urlsForUser } = require('./helpers');

// databases
const urlDatabase = {
  b2xVn2: {
    longURL: "http://www.lighthouselabs.ca",
    userID: "RtU6r2",
  },

  Fsm5xK: {
    longURL: "http://www.google.com",
    userID: "RtU6r2",
  },
};

const users = {
  userRandomID: {
    id: "RtU6r2",
    email: "test1@test.com",
    password: bcrypt.hashSync("test1", salt)
  },
};

// ---- TINY APP ----

// redirecting if user is logged in or needs to login
app.get("/", (req, res) => {
  if (!req.session.userID) {
    res.redirect("/login");
  } else {
    res.redirect("/urls");
  }
});

// main webpage with database listed
app.get("/urls", (req, res) => {
  if (req.session.userID) {
    const templateVars = {
      urls: urlsForUser(req.session.userID, urlDatabase),
      user: req.session.userID
    };
    res.render("urls_index", templateVars);
  }
});

// page for creating a new URL
app.get("/urls/new", (req, res) => {
  if (req.session.userID) {
    const templateVars = {
      user: req.session.userID
    };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

// page to display the inputed URL and RNG shortURL
app.get("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  if (urlDatabase[shortURL].userID === req.session.userID) {
    let templateVars = {
      id: shortURL,
      longURL: urlDatabase[shortURL].longURL,
      user: req.session.userID
    };
    res.render("urls_show", templateVars);
  }
});

// redirect shortURL ----> longURL
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

// generating random string for URL input
app.post("/urls", (req, res) => {
  if (!req.session.userID) {
    res.redirect("/urls");
  } else {
    const shortURL = generateRandomString(6);
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      user: req.session.userID
    };
    res.redirect(`/urls/${shortURL}`);
  }
});

// adding edit route
app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  if (!req.session.userID) {
    return res.status(401).send('Please log in or register');
  } else if (req.session.userID !== urlDatabase[shortURL].userID) {
    return res.status(401).send('You do not own this URL');
  } else {
    urlDatabase[req.params.id].longURL = req.body.longURL;
    res.redirect("/urls");
  }
});

// adding POST to delete selected URL
app.post("/urls/:id/delete", (req, res) => {
  const shortURL = req.params.id;
  if (!req.session.userID) {
    return res.status(401).send('Please log in or register');
  } else if (req.session.userID === urlDatabase[shortURL].userID) {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  } else {
    res.status(401).send("You are not authorized to access this URL");
  }
});

// login page
app.get("/login", (req, res) => {
  if (req.session.userID) {
    res.redirect("/urls");
  } else {
    const templateVars = { user: req.session.userID };
    res.render("urls_login", templateVars);
  }
});

// registration page
app.get("/register", (req, res) => {
  if (req.session.userID) {
    res.redirect("/urls");
  } else {
    const templateVars = { user: req.session.userID };
    res.render("urls_register", templateVars);
  }
});

// adding username when logging in
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = findUserByEmail(email, users);
  const result = bcrypt.compareSync(password, user.password);

  if (!email || !password) {
    return res.status(404).send('Please include email AND password');
  }

  if (!user) {
    return res.status(400).send('No user with that email found');
  }
  
  if (!result) {
    return res.status(400).send("wrong password");
  }

  req.session.userID = user.id;

  res.redirect("/urls");
});

// post registration page
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = findUserByEmail(email, users);

  if (!email || !password) {
    return res.status(400).send("Please include email AND password");
  }

  if (user) {
    return res.status(400).send("email is already in use");
  } else {

    // creating a new user
    const userID = generateRandomString(6);

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    users[userID] = {
      id: userID,
      email: email,
      password: hash
    };

    req.session.userID = userID;

    res.redirect('/urls');
  }
});

// directing user back to urls with no username when clicking logout
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});