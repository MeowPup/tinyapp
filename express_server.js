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
  RtU6r2: {
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
  const userID = req.session.userID;
  const user = users[userID];
  const userUrls = urlsForUser(req.session.userID, urlDatabase);

  if (!user) {
    const templateVars = {
      errorType: "401 Error",
      errorDetails: "Unauthorized",
      error: "Please login or register",
      user: req.session.userID
    };
    res.status(401).render("urls_error", templateVars);
  }

  const templateVars = {
    urls: userUrls,
    user,
  };

  return res.render("urls_index", templateVars);
});

// page for creating a new URL
app.get("/urls/new", (req, res) => {
  const userID = req.session.userID;
  const user = users[userID];

  if (!user) {
    res.redirect("/login");
  }

  const templateVars = {
    urls: urlDatabase,
    user,
  };

  res.render("urls_new", templateVars);
});

// page to display the inputed URL and RNG shortURL
app.get("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];
  const user = users[req.session.userID];
  const id = req.session.userID;

  if (!user) {
    const templateVars = {
      errorType: "401 Error",
      errorDetails: "Unauthorized",
      error: "Please login or register",
      user: req.session.userID
    };
    res.status(401).render("urls_error", templateVars);
  }

  if (longURL.userID !== id) {
    const templateVars = {
      errorType: "401 Error",
      errorDetails: "Unauthorized",
      error: "You do not own that URL",
      user: req.session.userID
    };
    res.status(401).render("urls_error", templateVars);
  }

  if (!longURL.userID) {
    const templateVars = {
      errorType: "401 Error",
      errorDetails: "Not Found",
      error: "That URL for the TinyURL does not exist",
      user: req.session.userID
    };
    res.status(404).render("urls_error", templateVars);
  }

  const templateVars = {
    shortURL,
    longURL,
    user,
  };

  res.render("urls_show", templateVars);
});

// redirect shortURL ----> longURL
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);

  if (!longURL) {
    const templateVars = {
      errorType: "401 Error",
      errorDetails: "Not Found",
      error: "That URL for the TinyURL does not exist",
      user: req.session.userID
    };
    res.status(404).render("urls_error", templateVars);
  }
});

// generating random string for URL input
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString(6);
  const user = users[req.session.userID];
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.session.userID
  };
  res.redirect(`/urls/${shortURL}`);

  if (!user) {
    const templateVars = {
      errorType: "401 Error",
      errorDetails: "Unauthorized",
      error: "Please login or register",
      user: req.session.userID
    };
    res.status(401).render("urls_error", templateVars);
  }
});

// adding edit route
app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL].longURL;
  const user = users[req.session.userID];
  const id = req.session.userID;
  let newURL = req.body.newURL;

  if (req.session.userID === urlDatabase[shortURL].userID) {
    urlDatabase[shortURL].longURL = newURL;
    res.redirect(`/urls`);
  } else if (!user) {
    const templateVars = {
      errorType: "401 Error",
      errorDetails: "Unauthorized",
      error: "Please login or register",
      user: req.session.userID
    };
    res.status(401).render("urls_error", templateVars);
  } else {
    if (longURL.userID !== id) {
      const templateVars = {
        errorType: "401 Error",
        errorDetails: "Unauthorized",
        error: "You do not own that URL",
        user: req.session.userID
      };
      res.status(401).render("urls_error", templateVars);
    }
  }
});

// adding POST to delete selected URL
app.post("/urls/:id/delete", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];
  const user = users[req.session.userID];
  const id = req.session.userID;

  if (!user) {
    const templateVars = {
      errorType: "401 Error",
      errorDetails: "Unauthorized",
      error: "Please login or register",
      user: req.session.userID
    };
    res.status(401).render("urls_error", templateVars);
  }

  if (longURL.userID !== id) {
    const templateVars = {
      errorType: "401 Error",
      errorDetails: "Unauthorized",
      error: "You do not own that URL",
      user: req.session.userID
    };
    res.status(401).render("urls_error", templateVars);
  }

  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// login page
app.get("/login", (req, res) => {
  const user = users[req.session.userID];
  const templateVars = {
    urls: urlDatabase,
    user
  };
  res.render("urls_login", templateVars);
});

// registration page
app.get("/register", (req, res) => {
  const user = users[req.session.userID];
  const templateVars = {
    urls: urlDatabase,
    user
  };
  res.render("urls_register", templateVars);
});

// adding username when logging in
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = findUserByEmail(email, users);
  
  if (!user) {
    const templateVars = {
      errorType: "401 Error",
      errorDetails: "Unauthorized",
      error: "Please login or register",
      user: req.session.userID
    };
    res.status(401).render("urls_error", templateVars);
  }

  const result = bcrypt.compareSync(password, user.password);

  if (!email || !password) {
    return res.status(404).send('Please include email AND password');
  }

  if (!result) {
    return res.status(401).send("wrong password");
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
    return res.status(404).send("Please include email AND password");
  }

  if (user) {
    const templateVars = {
      errorType: "401 Error",
      errorDetails: "Unauthorized",
      error: "Please login or register",
      user: req.session.userID
    };
    res.status(401).render("urls_error", templateVars);
  } else {

    // creating a new user
    const userID = generateRandomString(6);

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    users[userID] = {
      id: userID,
      email,
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