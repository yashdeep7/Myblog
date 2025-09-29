const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db/db');

// Registration form
router.get('/register', (req, res) => {
    res.render('register'); // userId available via res.locals
});

// Handle registration
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        await pool.query(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3)',
            [username, email, hashedPassword]
        );
        res.redirect('/login');
    } catch (err) {
        console.error(err);
        res.send('Error registering user');
    }
});

// Login form
router.get('/login', (req, res) => {
    res.render('login'); // userId available via res.locals
});

// Handle login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            req.session.userId = user.id;
            res.redirect('/');
        } else {
            res.send('Incorrect password');
        }
    } else {
        res.send('User not found');
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

module.exports = router;
