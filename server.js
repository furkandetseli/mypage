const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const config = require('./config/config.json')[process.env.NODE_ENV || 'development'];
const { Portfolio, Blog, Message } = require('./models');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

// Dosya yükleme ayarları
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

// SQLite bağlantısı
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite')
});

// Models
const About = sequelize.define('About', {
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  }
});

const Experience = sequelize.define('Experience', {
  company: {
    type: DataTypes.STRING,
    allowNull: false
  },
  position: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE
  },
  current: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

const Project = sequelize.define('Project', {
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  imageUrl: {
    type: DataTypes.STRING
  },
  projectUrl: {
    type: DataTypes.STRING
  }
});

const Contact = sequelize.define('Contact', {
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING
  },
  address: {
    type: DataTypes.TEXT
  },
  socialLinks: {
    type: DataTypes.JSON
  }
});

// Veritabanını senkronize et
sequelize.sync()
  .then(() => console.log('Veritabanı bağlantısı başarılı'))
  .catch(err => console.error('Veritabanı bağlantı hatası:', err));

// API Endpoints
// Admin Auth Middleware
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  if (token !== config.adminToken) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  next();
};

// API Routes
const apiRouter = express.Router();

// Blog endpoints
apiRouter.post('/blogs', authenticateAdmin, upload.single('image'), async (req, res) => {
    try {
        const { title, content, excerpt, category } = req.body;
        let imagePath = null;

        if (req.file) {
            imagePath = `/uploads/${req.file.filename}`;
        }

        const blog = await Blog.create({
            title,
            content,
            excerpt,
            category,
            image: imagePath
        });

        res.json(blog);
    } catch (error) {
        console.error('Blog creation error:', error);
        res.status(500).json({ error: error.message });
    }
});

apiRouter.get('/blogs', async (req, res) => {
    try {
        console.log('Blog listesi istendi');
        const blogs = await Blog.findAll({
            order: [['created_at', 'DESC']]
        });
        console.log('Bulunan blog sayısı:', blogs.length);
        res.json(blogs);
    } catch (error) {
        console.error('Blog fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

apiRouter.get('/blogs/:id', async (req, res) => {
    try {
        const blog = await Blog.findByPk(req.params.id);
        if (!blog) {
            return res.status(404).json({ error: 'Blog bulunamadı' });
        }
        res.json(blog);
    } catch (error) {
        console.error('Blog fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

apiRouter.put('/blogs/:id', authenticateAdmin, upload.single('image'), async (req, res) => {
    try {
        const blog = await Blog.findByPk(req.params.id);
        if (!blog) {
            return res.status(404).json({ error: 'Blog bulunamadı' });
        }

        const { title, content, excerpt, category } = req.body;
        let imagePath = blog.image;

        if (req.file) {
            imagePath = `/uploads/${req.file.filename}`;
            // Eski resmi sil
            if (blog.image) {
                const oldImagePath = path.join(__dirname, 'public', blog.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
        }

        await blog.update({
            title,
            content,
            excerpt,
            category,
            image: imagePath
        });

        res.json(blog);
    } catch (error) {
        console.error('Blog update error:', error);
        res.status(500).json({ error: error.message });
    }
});

apiRouter.delete('/blogs/:id', authenticateAdmin, async (req, res) => {
    try {
        const blog = await Blog.findByPk(req.params.id);
        if (!blog) {
            return res.status(404).json({ error: 'Blog bulunamadı' });
        }

        // Resmi sil
        if (blog.image) {
            const imagePath = path.join(__dirname, 'public', blog.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await blog.destroy();
        res.json({ message: 'Blog başarıyla silindi' });
    } catch (error) {
        console.error('Blog delete error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Messages endpoints
apiRouter.get('/messages', authenticateAdmin, async (req, res) => {
    try {
        const messages = await Message.findAll({
            order: [['created_at', 'DESC']]
        });
        res.json(messages);
    } catch (error) {
        console.error('Messages fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

apiRouter.post('/messages', async (req, res) => {
    try {
        const { name, email, message } = req.body;
        const newMessage = await Message.create({
            name,
            email,
            message,
            read: false
        });
        res.json(newMessage);
    } catch (error) {
        console.error('Message creation error:', error);
        res.status(500).json({ error: error.message });
    }
});

apiRouter.put('/messages/:id/read', authenticateAdmin, async (req, res) => {
    try {
        const message = await Message.findByPk(req.params.id);
        if (!message) {
            return res.status(404).json({ error: 'Mesaj bulunamadı' });
        }
        await message.update({ read: true });
        res.json(message);
    } catch (error) {
        console.error('Message update error:', error);
        res.status(500).json({ error: error.message });
    }
});

apiRouter.delete('/messages/:id', authenticateAdmin, async (req, res) => {
    try {
        const message = await Message.findByPk(req.params.id);
        if (!message) {
            return res.status(404).json({ error: 'Mesaj bulunamadı' });
        }
        await message.destroy();
        res.json({ message: 'Mesaj başarıyla silindi' });
    } catch (error) {
        console.error('Message delete error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Dashboard endpoint
apiRouter.get('/dashboard', authenticateAdmin, async (req, res) => {
    try {
        const [blogs, messages] = await Promise.all([
            Blog.count(),
            Message.count({ where: { read: false } })
        ]);

        res.json({
            totalBlogs: blogs,
            unreadMessages: messages
        });
    } catch (error) {
        console.error('Dashboard data fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

// About Endpoints
app.get('/api/about', async (req, res) => {
  try {
    const about = await About.findOne();
    res.json(about || { content: '' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/about', async (req, res) => {
  try {
    const [about, created] = await About.upsert({
      id: 1,
      content: req.body.content
    });
    res.status(created ? 201 : 200).json(about);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Experience Endpoints
app.get('/api/experiences', async (req, res) => {
  try {
    const experiences = await Experience.findAll({
      order: [['startDate', 'DESC']]
    });
    res.json(experiences);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/experiences', async (req, res) => {
  try {
    const experience = await Experience.create(req.body);
    res.status(201).json(experience);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/experiences/:id', async (req, res) => {
  try {
    const experience = await Experience.findByPk(req.params.id);
    if (!experience) {
      return res.status(404).json({ error: 'Deneyim bulunamadı' });
    }
    await experience.update(req.body);
    res.json(experience);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/experiences/:id', async (req, res) => {
  try {
    const experience = await Experience.findByPk(req.params.id);
    if (!experience) {
      return res.status(404).json({ error: 'Deneyim bulunamadı' });
    }
    await experience.destroy();
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Project Endpoints
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await Project.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const project = await Project.create(req.body);
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/projects/:id', async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Proje bulunamadı' });
    }
    await project.update(req.body);
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Proje bulunamadı' });
    }
    await project.destroy();
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Portfolio Endpoints
app.get('/api/portfolios', async (req, res) => {
  try {
    console.log('Portfolyo listesi istendi');
    const portfolios = await Portfolio.findAll({
      order: [['created_at', 'DESC']]
    });
    console.log('Bulunan portfolyolar:', portfolios.length);
    res.json(portfolios);
  } catch (error) {
    console.error('Portfolio fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/portfolios', authenticateAdmin, upload.single('image'), async (req, res) => {
  try {
    const { title, description, category, technologies, projectUrl, githubUrl } = req.body;
    const portfolio = await Portfolio.create({
      title,
      description,
      image: req.file ? `/uploads/${req.file.filename}` : null,
      category,
      technologies: technologies.split(','),
      projectUrl,
      githubUrl,
      created_at: new Date(),
      updated_at: new Date()
    });
    res.status(201).json(portfolio);
  } catch (error) {
    console.error('Portfolio create error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/portfolios/:id', authenticateAdmin, upload.single('image'), async (req, res) => {
  try {
    const portfolio = await Portfolio.findByPk(req.params.id);
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio bulunamadı' });
    }

    const updateData = {
      ...req.body,
      technologies: req.body.technologies.split(','),
      updated_at: new Date()
    };

    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
      if (portfolio.image) {
        const oldImagePath = path.join(__dirname, portfolio.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    }

    await portfolio.update(updateData);
    res.json(portfolio);
  } catch (error) {
    console.error('Portfolio update error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/portfolios/:id', authenticateAdmin, async (req, res) => {
  try {
    const portfolio = await Portfolio.findByPk(req.params.id);
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio bulunamadı' });
    }

    if (portfolio.image) {
      const imagePath = path.join(__dirname, portfolio.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await portfolio.destroy();
    res.json({ message: 'Portfolio başarıyla silindi' });
  } catch (error) {
    console.error('Portfolio delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Contact Endpoints
app.get('/api/contact', async (req, res) => {
  try {
    const contact = await Contact.findOne();
    res.json(contact || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/contact', async (req, res) => {
  try {
    const [contact, created] = await Contact.upsert({
      id: 1,
      ...req.body
    });
    res.status(created ? 201 : 200).json(contact);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API router'ı ana uygulamaya ekle
app.use('/api', apiRouter);

// Admin panel route'ları
app.get('/admin', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/admin/index.html'));
});

app.get('/admin/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/admin/login.html'));
});

// Auth middleware
function checkAuth(req, res, next) {
    const isLoggedIn = req.cookies.isLoggedIn === 'true';
    if (!isLoggedIn) {
        res.redirect('/admin/login');
        return;
    }
    next();
}

// Admin API endpoint'leri
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        // Burada gerçek kullanıcı doğrulaması yapılmalı
        if (username === 'admin' && password === 'admin123') {
            const token = 'admin-1234-secure-token-5678'; // Gerçek uygulamada JWT kullanılmalı
            res.json({ token });
        } else {
            res.status(401).json({ error: 'Hatalı kullanıcı adı veya şifre' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Giriş işlemi başarısız' });
    }
});

// Tüm admin sayfaları için wildcard route
app.get('/admin/*', checkAuth, (req, res) => {
    const page = req.path.split('/admin/')[1];
    const filePath = path.join(__dirname, `public/admin/${page}`);
    
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.redirect('/admin');
    }
});

// Static dosyalar için middleware'ler
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use(express.static('public'));

// Uploads klasörünü oluştur (eğer yoksa)
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Veritabanı bağlantısını test et
async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('Veritabanı bağlantısı başarılı.');
    } catch (error) {
        console.error('Veritabanı bağlantı hatası:', error);
    }
}

testConnection();

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`);
});
