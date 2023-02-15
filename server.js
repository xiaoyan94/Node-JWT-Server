const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// 设置端口号
const port = process.env.PORT || 5000;

// 跨域处理
app.use(cors());

// 配置 body-parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// 数据库模拟用户数据
const users = [
  {
    id: 1,
    username: 'admin',
    password: '$2a$10$CvKT2WcrL8mODKg1eGLy1ufqXpDf8ByKoZMCkkDZL5o5nD8zlS5nS',
    email: 'admin@example.com'
  }
];

// 生成密码
const password = '123456';

bcrypt.hash(password, 10, (err, hash) => {
  console.log(hash); // 输出经过哈希计算后的密码
  users[0].password=hash;
});

// 登录
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(user => user.username === username);

  if (!user) {
    return res.status(404).json({ message: '用户不存在' });
  }

  bcrypt.compare(password, user.password, (err, isMatch) => {
    if (err) throw err;

    if (isMatch) {
      const token = jwt.sign({ id: user.id }, 'secretkey', { expiresIn: '1h' });
      res.json({ token });
    } else {
      res.status(401).json({ message: '密码不正确' });
    }
  });
});

// 校验token
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: '没有权限，请先登录' });
  }

  jwt.verify(token, 'secretkey', (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: '无效的 token' });
    }

    req.userId = decoded.id;
    next();
  });
}

// 获取受保护的数据
app.get('/api/data', verifyToken, (req, res) => {
  const user = users.find(user => user.id === req.userId);

  if (!user) {
    return res.status(404).json({ message: '用户不存在' });
  }

  res.json({ message: `您好，${user.username}` });
});

// 监听端口号
app.listen(port, () => console.log(`服务器运行在 http://localhost:${port}`));
