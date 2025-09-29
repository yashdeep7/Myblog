const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();  // <-- Initialize app first

// Session middleware
app.use(session({
  secret: 'yourSecretKey',   // change to a secure random string
  resave: false,
  saveUninitialized: true
}));

// ✅ Make userId available in all EJS templates
app.use((req, res, next) => {
  res.locals.userId = req.session.userId || null;
  next();
});

// Set EJS as template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const postRoutes = require('./routes/posts');
app.use('/', postRoutes);

const userRoutes = require('./routes/users');
app.use('/', userRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
