import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { Property } from './models/Property.js';
import { User } from './models/User.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and body parsing
app.use(cors());
app.use(express.json());

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded images statically
app.use('/uploads', express.static(uploadsDir));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✓ Successfully connected to MongoDB'))
  .catch((err) => console.error('✗ MongoDB connection failure:', err));

// Configure Multer for local disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate clean filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'stay-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, JPG, PNG, and WEBP image uploads are allowed!'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// JWT Middleware to protect routes
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Generate JWT Token
const generateToken = (userId, userType) => {
  return jwt.sign({ userId, userType }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '30d' });
};

// REST API Endpoints

// AUTH ROUTES

// 1. Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword, userType, university, phoneNumber } = req.body;

    // Validate inputs
    if (!fullName || !email || !password || !confirmPassword || !userType) {
      return res.status(400).json({ error: 'All required fields must be filled' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Create new user
    const newUser = new User({
      fullName,
      email: email.toLowerCase(),
      password,
      userType,
      university: userType === 'student' ? university : null,
      phoneNumber
    });

    await newUser.save();

    // Generate token
    const token = generateToken(newUser._id, newUser.userType);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        userType: newUser.userType
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Error registering user' });
  }
});

// 2. Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user._id, user.userType);

    res.json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        userType: user.userType
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error logging in' });
  }
});

// 3. Get current user (protected route)
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user' });
  }
});

// REST API Endpoints - Properties


app.get('/api/properties', async (req, res) => {
  try {
    const properties = await Property.find().sort({ createdAt: -1 });
    res.json(properties);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching stays.' });
  }
});

// 2. Get single stay details
app.get('/api/properties/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ error: 'Stay not found.' });
    }
    res.json(property);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching details.' });
  }
});

// 3. Create a stay listing (with multiple image uploads) - Protected route for landlords
app.post('/api/properties', authenticateToken, upload.array('images', 8), async (req, res) => {
  try {
    // Only landlords can create properties
    const user = await User.findById(req.user.userId);
    if (!user || user.userType !== 'landlord') {
      return res.status(403).json({ error: 'Only landlords can create properties' });
    }

    const { title, location, area, price, period, description, amenities, badges, isVerified } = req.body;
    
    // Parse JSON string parameters safely if sent via FormData
    const parsedAmenities = typeof amenities === 'string' ? JSON.parse(amenities) : amenities;
    const parsedBadges = typeof badges === 'string' ? JSON.parse(badges) : badges;

    // Map uploaded file path references to HTTP URLs
    const uploadedImagesUrls = req.files
      ? req.files.map(file => `http://localhost:${PORT}/uploads/${file.filename}`)
      : [];

    const newProperty = new Property({
      title,
      location,
      area,
      price: Number(price),
      period: period || 'month',
      description,
      amenities: parsedAmenities || [],
      badges: parsedBadges || [],
      isVerified: isVerified === 'true' || isVerified === true,
      images: uploadedImagesUrls,
      landlordId: req.user.userId
    });

    const savedProperty = await newProperty.save();
    res.status(201).json(savedProperty);
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(400).json({ error: error.message || 'Error creating property.' });
  }
});

// 4. Get landlord's own properties (protected route)
app.get('/api/properties/landlord/my-properties', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.userType !== 'landlord') {
      return res.status(403).json({ error: 'Only landlords can access this endpoint' });
    }

    const properties = await Property.find({ landlordId: req.user.userId }).sort({ createdAt: -1 });
    res.json(properties);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching your properties.' });
  }
});

// 5. Update property (title, price, images) - Protected route
app.put('/api/properties/:id', authenticateToken, upload.array('images', 8), async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({ error: 'Property not found.' });
    }

    // Verify ownership
    if (property.landlordId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'You can only edit your own properties' });
    }

    const { title, price } = req.body;

    // Update basic fields
    if (title) property.title = title;
    if (price) property.price = Number(price);

    // Handle image updates
    if (req.files && req.files.length > 0) {
      // Delete old image files
      property.images.forEach(imageUrl => {
        try {
          if (imageUrl.includes('localhost')) {
            const filename = imageUrl.split('/uploads/')[1];
            if (filename) {
              const filepath = path.join(uploadsDir, filename);
              if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
              }
            }
          }
        } catch (err) {
          console.error('Error deleting old image:', err);
        }
      });

      // Add new image URLs
      const newImageUrls = req.files.map(file => `http://localhost:${PORT}/uploads/${file.filename}`);
      property.images = newImageUrls;
    }

    const updatedProperty = await property.save();
    res.json({ message: 'Property updated successfully', property: updatedProperty });
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(400).json({ error: error.message || 'Error updating property.' });
  }
});

// 6. Delete a stay listing - Protected route
app.delete('/api/properties/:id', authenticateToken, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({ error: 'Stay not found.' });
    }

    // Verify ownership
    if (property.landlordId && property.landlordId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'You can only delete your own properties' });
    }

    await Property.findByIdAndDelete(req.params.id);
    
    // Attempt to delete local upload files physically from disk
    property.images.forEach(imageUrl => {
      try {
        const filename = imageUrl.split('/uploads/')[1];
        if (filename) {
          const filepath = path.join(uploadsDir, filename);
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
          }
        }
      } catch (err) {
        console.error('Error deleting file from disk:', err);
      }
    });

    res.json({ message: 'Stay listing deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Server error deleting stay.' });
  }
});

// 7. Seeding Route (to easily populate mock data for testing)
app.post('/api/properties/seed', async (req, res) => {
  try {
    // Delete existing properties
    await Property.deleteMany({});

    const mockData = [
      {
        title: "Casa Verde Residences",
        location: "Lagao, General Santos City",
        area: "Lagao",
        price: 3500,
        period: "month",
        description: "Modern, comfortable rooms perfect for students. Features direct accessibility to public transport, high-speed internet connection, quiet study zones, and nearby convenience stores.",
        amenities: ["WiFi", "Aircon", "Study Desk", "Shared Kitchen", "24/7 Security"],
        badges: ["Popular", "Verified"],
        isVerified: true,
        images: ["https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80"]
      },
      {
        title: "St. Elizabeth Student Dorm",
        location: "Dadiangas Heights, General Santos City",
        area: "Dadiangas",
        price: 2800,
        period: "month",
        description: "Affordable room accommodations with premium features. Walking distance from university gates. Ideal for students on a budget seeking security.",
        amenities: ["WiFi", "Bed Space", "Study Desk", "CCTV Monitoring"],
        badges: ["New", "Verified"],
        isVerified: true,
        images: ["https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80"]
      },
      {
        title: "Pioneer Heights Boarding House",
        location: "Calumpang, General Santos City",
        area: "Calumpang",
        price: 4200,
        period: "month",
        description: "Premium studio stays designed for private living. Close to major commercial districts and campuses. Fully airconditioned with private washroom.",
        amenities: ["WiFi", "Aircon", "Private Bath", "Cabinet Space"],
        badges: ["Top Rated", "Verified"],
        isVerified: true,
        images: ["https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=600&q=80"]
      }
    ];

    const seeded = await Property.insertMany(mockData);
    res.json({ message: 'Database successfully seeded!', count: seeded.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running in development mode on http://localhost:${PORT}`);
});
