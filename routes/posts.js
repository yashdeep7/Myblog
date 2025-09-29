const express = require('express');
const router = express.Router();
const pool = require('../db/db');

// Home page - show all posts with usernames
router.get('/', async (req, res) => {
    try {
        let posts;
        if (req.session.userId) {
            posts = await pool.query(
                `SELECT posts.*, users.username
                 FROM posts
                 JOIN users ON posts.user_id = users.id
                 WHERE is_public = TRUE OR user_id = $1
                 ORDER BY created_at DESC`,
                [req.session.userId]
            );
        } else {
            posts = await pool.query(
                `SELECT posts.*, users.username
                 FROM posts
                 JOIN users ON posts.user_id = users.id
                 WHERE is_public = TRUE
                 ORDER BY created_at DESC`
            );
        }
        res.render('index', { posts: posts.rows });
    } catch (err) {
        console.error(err);
        res.send("Error loading posts");
    }
});

// Search posts
router.get('/search', async (req, res) => {
    try {
        const query = req.query.q;
        let posts;

        if (req.session.userId) {
            posts = await pool.query(
                `SELECT posts.*, users.username
                 FROM posts
                 JOIN users ON posts.user_id = users.id
                 WHERE (is_public = TRUE OR user_id = $1)
                 AND (title ILIKE $2 OR content ILIKE $2)
                 ORDER BY created_at DESC`,
                [req.session.userId, `%${query}%`]
            );
        } else {
            posts = await pool.query(
                `SELECT posts.*, users.username
                 FROM posts
                 JOIN users ON posts.user_id = users.id
                 WHERE is_public = TRUE
                 AND (title ILIKE $1 OR content ILIKE $1)
                 ORDER BY created_at DESC`,
                [`%${query}%`]
            );
        }

        res.render('search', { posts: posts.rows, query });
    } catch (err) {
        console.error(err);
        res.send("Error searching posts");
    }
});

// New post form
router.get('/new', (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    res.render('new');
});

// Create new post
router.post('/new', async (req, res) => {
    try {
        const { title, content, is_public } = req.body;
        const userId = req.session.userId;
        if (!userId) return res.redirect('/login');

        await pool.query(
            'INSERT INTO posts (title, content, user_id, is_public) VALUES ($1, $2, $3, $4)',
            [title, content, userId, is_public === 'on']
        );

        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.send("Error creating post");
    }
});

// Edit post form
router.get('/post/:id/edit', async (req, res) => {
    try {
        const { id } = req.params;
        const postResult = await pool.query('SELECT * FROM posts WHERE id = $1', [id]);
        const post = postResult.rows[0];

        if (!post || req.session.userId !== post.user_id) {
            return res.send("Not authorized.");
        }

        res.render('edit', { post });
    } catch (err) {
        console.error(err);
        res.send("Error loading edit page");
    }
});

// Update post
router.post('/post/:id/edit', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, is_public } = req.body;
        const postResult = await pool.query('SELECT * FROM posts WHERE id = $1', [id]);
        const post = postResult.rows[0];

        if (!post || req.session.userId !== post.user_id) {
            return res.send("Not authorized.");
        }

        await pool.query(
            'UPDATE posts SET title = $1, content = $2, is_public = $3 WHERE id = $4',
            [title, content, is_public === 'on', id]
        );

        res.redirect('/post/' + id);
    } catch (err) {
        console.error(err);
        res.send("Error updating post");
    }
});

// Delete post
router.post('/post/:id/delete', async (req, res) => {
    try {
        const { id } = req.params;
        const postResult = await pool.query('SELECT * FROM posts WHERE id = $1', [id]);
        const post = postResult.rows[0];

        if (!post || req.session.userId !== post.user_id) {
            return res.send("Not authorized.");
        }

        await pool.query('DELETE FROM posts WHERE id = $1', [id]);
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.send("Error deleting post");
    }
});

// View single post
router.get('/post/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const postResult = await pool.query(
            `SELECT posts.*, users.username
             FROM posts
             JOIN users ON posts.user_id = users.id
             WHERE posts.id = $1`,
            [id]
        );
        const post = postResult.rows[0];

        if (!post) return res.send("Post not found");

        res.render('post', { post });
    } catch (err) {
        console.error(err);
        res.send("Error loading post");
    }
});

module.exports = router;
