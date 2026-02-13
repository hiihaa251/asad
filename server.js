const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer'); // Make sure to run: npm install multer
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// --- NEW: Multer configuration for file uploads ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let dest = 'uploads/'; // Default folder
        if (file.mimetype.startsWith('video/')) {
            dest = 'videos/';
        } else if (file.mimetype.startsWith('image/')) {
            dest = 'images/';
        }
        // Ensure the directory exists
        fs.mkdirSync(path.join(__dirname, dest), { recursive: true });
        cb(null, path.join(__dirname, dest));
    },
    filename: function (req, file, cb) {
        // Create a unique filename to avoid overwriting
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

const DATA_DIR = path.resolve(__dirname);
const REVIEWS_FILE = path.join(DATA_DIR, 'server_reviews.json');
const ORDERS_FILE = path.join(DATA_DIR, 'server_orders.json');
const ADMIN_CONFIG_FILE = path.join(DATA_DIR, 'admin_config.json');

function readJson(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw || JSON.stringify(fallback));
  } catch (e) { return fallback; }
}

function writeJson(file, data) {
  try { fs.writeFileSync(file, JSON.stringify(data, null, 2)); return true; } catch (e) { console.error(e); return false; }
}

app.get('/api/ping', (req, res) => res.json({ ok: true }));

app.get('/api/reviews', (req, res) => {
  const reviews = readJson(REVIEWS_FILE, []);
  res.json(reviews);
});

// Return current id.json content
app.get('/api/id', (req, res) => {
  try{
    const idFilePath = path.join(DATA_DIR, 'id.json');
    if(!fs.existsSync(idFilePath)) return res.status(404).json({ error: 'id.json not found' });
    const raw = fs.readFileSync(idFilePath, 'utf8');
    const json = JSON.parse(raw || '{}');
    return res.json(json);
  }catch(e){ console.error(e); return res.status(500).json({ error: 'read error' }); }
});
 
// Replace id.json with the provided JSON body (admin save)
app.put('/api/id', (req, res) => {
  try{
    const body = req.body;
    if(!body) return res.status(400).json({ error: 'No JSON provided' });
    const idFile = path.join(DATA_DIR, 'id.json');
    // Write nicely formatted JSON
    fs.writeFileSync(idFile, JSON.stringify(body, null, 2), 'utf8');
    return res.json({ ok: true });
  }catch(e){ console.error(e); return res.status(500).json({ error: 'write failed' }); }
});

// --- NEW: Endpoint to add a new product ---
app.post('/api/add-product', upload.single('mediaFile'), (req, res) => {
    try {
        const { id, name, price, category, description } = req.body;
        const file = req.file;

        if (!id || !name || !price || !category || !file) {
            return res.status(400).json({ error: 'Missing required fields (id, name, price, category, mediaFile).' });
        }

        const idFilePath = path.join(DATA_DIR, 'id.json');
        const products = readJson(idFilePath, {});

        if (products[id]) {
            // Optionally delete the uploaded file if ID exists to prevent clutter
            fs.unlinkSync(file.path);
            return res.status(400).json({ error: `Product with ID ${id} already exists.` });
        }

        const newProduct = {
            name,
            price,
            category,
            description: description || ''
        };

        if (file.mimetype.startsWith('video/')) {
            newProduct.mediaType = 'video';
            newProduct.videoUrl = `videos/${file.filename}`;
            newProduct.thumbnail = `images/a1.png`; // Default thumbnail for new videos
        } else { // Image
            newProduct.mediaType = 'image';
            newProduct.thumbnail = `images/${file.filename}`;
        }

        products[id] = newProduct;

        if (!writeJson(idFilePath, products)) {
            throw new Error('Failed to write to id.json');
        }

        res.json({ success: true, message: 'Product added successfully.', product: newProduct });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ error: error.message || 'Server error while adding product.' });
    }
});

// --- NEW: Endpoint to delete a product ---
app.delete('/api/products/:id', (req, res) => {
    try {
        const id = req.params.id;
        const idFilePath = path.join(DATA_DIR, 'id.json');
        const products = readJson(idFilePath, {});

        if (!products[id]) {
            return res.status(404).json({ error: `Product with ID ${id} not found.` });
        }

        delete products[id];

        if (writeJson(idFilePath, products)) {
            res.json({ success: true, message: `Product ${id} deleted.` });
        } else {
            res.status(500).json({ error: 'Failed to save id.json' });
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: error.message || 'Server error while deleting product.' });
    }
});

// --- NEW: Endpoint to edit a product ---
app.put('/api/products/:id', upload.single('mediaFile'), (req, res) => {
    try {
        const id = req.params.id;
        const { name, price, category, description } = req.body;
        const file = req.file;

        const idFilePath = path.join(DATA_DIR, 'id.json');
        const products = readJson(idFilePath, {});

        if (!products[id]) {
            return res.status(404).json({ error: `Product with ID ${id} not found.` });
        }

        // Update fields if provided
        if (name) products[id].name = name;
        if (price) products[id].price = price;
        if (category) products[id].category = category;
        if (description !== undefined) products[id].description = description;

        // Update media if a new file is uploaded
        if (file) {
            if (file.mimetype.startsWith('video/')) {
                products[id].mediaType = 'video';
                products[id].videoUrl = `videos/${file.filename}`;
                // Optional: Keep old thumbnail or set default
                if (!products[id].thumbnail) products[id].thumbnail = `images/a1.png`;
            } else {
                products[id].mediaType = 'image';
                products[id].thumbnail = `images/${file.filename}`;
                delete products[id].videoUrl; // Remove video url if switching to image
            }
        }

        if (writeJson(idFilePath, products)) {
            res.json({ success: true, message: 'Product updated successfully.', product: products[id] });
        } else {
            res.status(500).json({ error: 'Failed to save id.json' });
        }
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: error.message || 'Server error while updating product.' });
    }
});

// --- NEW: Login Endpoint (Basic) ---
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    // Read credentials from file, default to isma/123+ if file doesn't exist
    const config = readJson(ADMIN_CONFIG_FILE, { username: 'isma', password: '123+' });

    if (username === config.username && password === config.password) {
        res.json({ success: true, token: 'access-granted-token' });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// --- NEW: Change Password Endpoint ---
app.post('/api/change-password', (req, res) => {
    const { oldPassword, newUsername, newPassword } = req.body;
    const config = readJson(ADMIN_CONFIG_FILE, { username: 'isma', password: '123+' });

    if (config.password !== oldPassword) {
        return res.status(401).json({ error: 'Password-kii hore waa khalad (Incorrect old password).' });
    }

    config.username = newUsername;
    config.password = newPassword;

    if (writeJson(ADMIN_CONFIG_FILE, config)) {
        res.json({ success: true, message: 'Credentials updated.' });
    } else {
        res.status(500).json({ error: 'Failed to save credentials.' });
    }
});

app.post('/api/reviews', (req, res) => {
  const rev = req.body;
  if (!rev) return res.status(400).json({ error: 'No body' });
  const reviews = readJson(REVIEWS_FILE, []);
  rev.id = rev.id || Date.now();
  rev.verified = !!rev.verified;
  reviews.push(rev);
  writeJson(REVIEWS_FILE, reviews);
  res.json(rev);
});

app.put('/api/reviews/:id', (req, res) => {
  const id = String(req.params.id);
  const updates = req.body || {};
  const reviews = readJson(REVIEWS_FILE, []);
  const idx = reviews.findIndex(r => String(r.id) === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  reviews[idx] = Object.assign({}, reviews[idx], updates);
  writeJson(REVIEWS_FILE, reviews);
  res.json(reviews[idx]);
});

app.delete('/api/reviews/:id', (req, res) => {
  const id = String(req.params.id);
  let reviews = readJson(REVIEWS_FILE, []);
  const before = reviews.length;
  reviews = reviews.filter(r => String(r.id) !== id);
  writeJson(REVIEWS_FILE, reviews);
  res.json({ ok: true, removed: before - reviews.length });
});

app.get('/api/orders', (req, res) => {
  const orders = readJson(ORDERS_FILE, []);
  res.json(orders);
});

app.post('/api/orders', (req, res) => {
  const order = req.body;
  if (!order) return res.status(400).json({ error: 'No body' });
  const orders = readJson(ORDERS_FILE, []);
  order.id = order.id || Date.now();
  orders.push(order);
  writeJson(ORDERS_FILE, orders);
  res.json(order);
});

app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => console.log(`API server running on http://localhost:${PORT}`));
