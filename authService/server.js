const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-pour-dev';

const dbConfig = {
  host: process.env.DB_HOST || 'mysql-service',
  user: 'root',
  password: 'rootpass123',
  database: 'todoapp'
};


app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const conn = await mysql.createConnection(dbConfig);
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await conn.execute(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashedPassword]
    );
    
    await conn.end();
    res.json({ message: 'User registered', userId: result.insertId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const conn = await mysql.createConnection(dbConfig);
    
    const [rows] = await conn.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    
    await conn.end();
    
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET);
    res.json({ token, userId: user.id, username: user.username });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.post('/verify', (req, res) => {
  try {
    const { token } = req.body;
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, userId: decoded.userId });
  } catch (error) {
    res.status(401).json({ valid: false });
  }
});

app.listen(3000, () => {
  console.log('Auth service running on port 3000');
});