import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Property } from './models/Property.js';
import { User } from './models/User.js';
import { Conversation } from './models/Conversation.js';
import { Message } from './models/Message.js';
import { Booking } from './models/Booking.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and body parsing
app.use(cors());
app.use(express.json());

// Global cache prevention middleware to avoid cross-user data leaks
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Socket.IO Connection
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
  });

  socket.on('send_message', async (data) => {
    // data = { conversationId, senderId, text }
    try {
      const msg = new Message({
        conversationId: data.conversationId,
        senderId: data.senderId,
        text: data.text,
        readBy: [data.senderId]
      });
      await msg.save();
      
      await Conversation.findByIdAndUpdate(data.conversationId, {
        lastMessage: data.text,
        updatedAt: Date.now()
      });

      const plainMsg = {
        ...msg.toJSON(),
        conversationId: data.conversationId.toString(),
        senderId: data.senderId.toString()
      };

      // Broadcast to room
      io.to(data.conversationId).emit('receive_message', plainMsg);
    } catch (error) {
      console.error('Socket message error:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded images statically
app.use('/uploads', express.static(uploadsDir));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✨ Successfully connected to MongoDB');
    // Ensure admin user exists for relational integrity (like conversations)
    try {
      const adminExists = await User.findOne({ email: ADMIN_EMAIL });
      if (!adminExists) {
        const admin = new User({
          fullName: ADMIN_DISPLAY_NAME,
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          userType: 'admin'
        });
        await admin.save();
        console.log('✅ Admin user seeded.');
      }
    } catch (err) {
      console.error('⚠️ Could not seed admin user:', err);
    }

    // One-time data fix: sync isVerified with verificationStatus for all properties
    // This corrects properties that were incorrectly auto-verified by premium subscriptions
    try {
      const fixResult = await Property.updateMany(
        { verificationStatus: { $ne: 'approved' }, isVerified: true },
        { isVerified: false, $pull: { badges: 'Verified' } }
      );
      if (fixResult.modifiedCount > 0) {
        console.log(`🔧 Fixed ${fixResult.modifiedCount} property(ies) with incorrect verification status.`);
      }
    } catch (err) {
      console.error('⚠️ Could not run verification data fix:', err);
    }
  })
  .catch((err) => console.error('❌ MongoDB connection failure:', err));

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer for Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Basic folder setting.
    return {
      folder: 'unistay_uploads',
      resource_type: 'auto', // Allow images and raw documents (PDF/DOCX)
      public_id: `stay-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
    };
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedExts = /jpeg|jpg|png|webp|pdf|doc|docx/;
    const extname = allowedExts.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype.startsWith('image/') || 
                     file.mimetype === 'application/pdf' || 
                     file.mimetype === 'application/msword' || 
                     file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and Word documents are allowed!'));
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

// Admin guard — requires the JWT to carry isAdmin: true
const authenticateAdmin = (req, res, next) => {
  authenticateToken(req, res, () => {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
};

// Generate JWT Token
const generateToken = (userId, userType) => {
  return jwt.sign({ userId, userType }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '30d' });
};

// Hardcoded admin credentials (configured via .env)
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@unistay.local').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_DISPLAY_NAME = process.env.ADMIN_DISPLAY_NAME || 'UniStay Admin';

const generateAdminToken = (adminId) => {
  return jwt.sign(
    { isAdmin: true, email: ADMIN_EMAIL, userType: 'admin', userId: adminId },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '30d' }
  );
};

// REST API Endpoints

// AUTH ROUTES

// 1. Register endpoint
app.post('/api/auth/register', upload.fields([{ name: 'document', maxCount: 1 }, { name: 'profileImage', maxCount: 1 }]), async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword, userType, university, phoneNumber } = req.body;

    // Validate inputs
    if (!fullName || !email || !password || !confirmPassword || !userType) {
      return res.status(400).json({ error: 'All required fields must be filled' });
    }

    const files = req.files || {};

    if (userType === 'landlord' && !files['document']) {
      return res.status(400).json({ error: 'Landlords must submit a valid Business Permit or ID' });
    }

    if (userType === 'landlord' && !files['profileImage']) {
      return res.status(400).json({ error: 'Landlords must upload a formal profile picture' });
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
      phoneNumber,
      documentUrl: files['document'] ? `http://localhost:${PORT}/uploads/${files['document'][0].filename}` : null,
      profileImage: files['profileImage'] ? `http://localhost:${PORT}/uploads/${files['profileImage'][0].filename}` : null
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

    // Admin login (hardcoded credentials but real DB user for relations)
    if (email.toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Find admin user in DB or create it on the fly
      let admin = await User.findOne({ email: ADMIN_EMAIL });
      if (!admin) {
        admin = new User({
          fullName: ADMIN_DISPLAY_NAME,
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          userType: 'admin'
        });
        await admin.save();
      }
      return res.json({
        message: 'Logged in successfully',
        token: generateAdminToken(admin._id.toString()),
        user: {
          id: admin._id.toString(),
          fullName: ADMIN_DISPLAY_NAME,
          email: ADMIN_EMAIL,
          userType: 'admin'
        }
      });
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
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user' });
  }
});

// REST API Endpoints - Properties


app.get('/api/properties', async (req, res) => {
  try {
    const properties = await Property.find({ isHidden: { $ne: true } })
      .sort({ isBoosted: -1, createdAt: -1 });
    res.json(properties);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching stays.' });
  }
});

// 2. Get single stay details
app.get('/api/properties/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('landlordId', 'fullName profileImage isVerified');
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

    // Subscription constraints
    if (user.subscriptionTier === 'none' || !user.subscriptionExpiry || new Date(user.subscriptionExpiry) < new Date()) {
      return res.status(403).json({ error: 'You must have an active subscription to post properties.' });
    }

    const propertyCount = await Property.countDocuments({ landlordId: user._id });
    if (user.subscriptionTier === 'regular' && propertyCount >= 2) {
      return res.status(403).json({ error: 'Regular tier limit reached. Please upgrade to premium to post more properties (max 5).' });
    }
    if (user.subscriptionTier === 'premium' && propertyCount >= 5) {
      return res.status(403).json({ error: 'Premium tier limit reached (max 5 properties).' });
    }

    const { title, location, area, price, period, description, amenities, features, badges, isVerified, latitude, longitude, hasCurfew, roomCapacity, availableBeds } = req.body;
    
    // Parse JSON string parameters safely if sent via FormData
    const parsedAmenities = typeof amenities === 'string' ? JSON.parse(amenities) : amenities;
    const parsedFeatures = typeof features === 'string' ? JSON.parse(features) : features;
    const parsedBadges = typeof badges === 'string' ? JSON.parse(badges) : (badges || []);
    
    const isPremium = user.subscriptionTier === 'premium';
    // Remove 'Verified' from badges — verification is admin-only per-property
    const cleanBadges = parsedBadges.filter(b => b !== 'Verified');

    // Map uploaded file path references to HTTP URLs
    // Cloudinary automatically provides the URL in `file.path`
    const uploadedImagesUrls = req.files
      ? req.files.map(file => file.path)
      : [];

    const cap = roomCapacity ? Number(roomCapacity) : 1;

    const newProperty = new Property({
      title,
      location,
      area,
      price: Number(price),
      period: period || 'month',
      description,
      amenities: parsedAmenities || [],
      features: parsedFeatures || [],
      badges: cleanBadges,
      hasCurfew: hasCurfew === 'true' || hasCurfew === true,
      roomCapacity: cap,
      availableBeds: availableBeds !== undefined ? Number(availableBeds) : cap,
      isHidden: false,
      isBoosted: isPremium,
      isVerified: false,
      verificationStatus: 'pending',
      rejectionReason: '',
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
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

// ---------------------------------------------------------------------------
// CHAT ENDPOINTS
// ---------------------------------------------------------------------------

// Get all conversations for a user
app.get('/api/conversations', authenticateToken, async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user.userId })
      .populate('participants', 'fullName email userType profileImage')
      .populate('propertyId', 'title location images price')
      .sort({ updatedAt: -1 });
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching conversations.' });
  }
});

// Get unread messages count
app.get('/api/messages/unread-count', authenticateToken, async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user.userId }).select('_id');
    const conversationIds = conversations.map(c => c._id);
    
    const count = await Message.countDocuments({
      conversationId: { $in: conversationIds },
      senderId: { $ne: req.user.userId },
      readBy: { $ne: req.user.userId }
    });
    
    res.json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching unread count.' });
  }
});

// Get or Create a conversation for a specific property with landlord
app.post('/api/conversations', authenticateToken, async (req, res) => {
  try {
    const { propertyId, landlordId } = req.body;
    const studentId = req.user.userId;

    let conversation = await Conversation.findOne({
      participants: { $all: [studentId, landlordId] },
      propertyId: propertyId
    })
    .populate('participants', 'fullName email userType profileImage')
    .populate('propertyId', 'title location images price');

    if (!conversation) {
      conversation = new Conversation({
        participants: [studentId, landlordId],
        propertyId
      });
      await conversation.save();
      
      // Populate newly created conversation
      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'fullName email userType profileImage')
        .populate('propertyId', 'title location images price');
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: 'Server error creating conversation.' });
  }
});

// Get messages for a conversation
app.get('/api/conversations/:id/messages', authenticateToken, async (req, res) => {
  try {
    const messages = await Message.find({ conversationId: req.params.id }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching messages.' });
  }
});

// Mark messages as read
app.put('/api/conversations/:id/read', authenticateToken, async (req, res) => {
  try {
    await Message.updateMany(
      { 
        conversationId: req.params.id, 
        senderId: { $ne: req.user.userId },
        readBy: { $ne: req.user.userId }
      },
      { $push: { readBy: req.user.userId } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error marking messages as read.' });
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

    const { title, location, area, price, period, description, amenities, features, badges, latitude, longitude, hasCurfew, roomCapacity, availableBeds } = req.body;

    // Update basic fields
    if (title) property.title = title;
    if (location) property.location = location;
    if (area) property.area = area;
    if (price) property.price = Number(price);
    if (period) property.period = period;
    if (description) property.description = description;
    if (latitude !== undefined) property.latitude = latitude ? Number(latitude) : null;
    if (longitude !== undefined) property.longitude = longitude ? Number(longitude) : null;
    if (hasCurfew !== undefined) property.hasCurfew = hasCurfew === 'true' || hasCurfew === true;
    if (roomCapacity !== undefined) property.roomCapacity = Number(roomCapacity);
    if (availableBeds !== undefined) property.availableBeds = Number(availableBeds);

    if (amenities !== undefined) {
      const parsedAmenities = typeof amenities === 'string' ? JSON.parse(amenities) : amenities;
      property.amenities = parsedAmenities || [];
    }

    if (features !== undefined) {
      const parsedFeatures = typeof features === 'string' ? JSON.parse(features) : features;
      property.features = parsedFeatures || [];
    }

    if (badges !== undefined) {
      const parsedBadges = typeof badges === 'string' ? JSON.parse(badges) : badges;
      property.badges = parsedBadges || [];
    }

    // Handle image updates
    if (req.files && req.files.length > 0) {
      // With Cloudinary, we just append the new URLs.
      // Deleting old images from Cloudinary would require their public_ids.
      const newImagesUrls = req.files.map(file => file.path);
      property.images = [...property.images, ...newImagesUrls];
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
    
    // Cloudinary images can be deleted using cloudinary.uploader.destroy()
    // but extracting public_id from URLs is complex.
    // For free tiers, leaving the images orphaned is usually fine, or you can implement cleanup later.

    res.json({ success: true, message: 'Stay listing deleted.' });
  } catch (error) {
    res.status(500).json({ error: 'Server error deleting stay.' });
  }
});

// 7. Get user profile and their properties
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let properties = [];
    if (user.userType === 'landlord') {
      properties = await Property.find({ landlordId: user._id });
    }

    res.json({ user, properties });
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching profile.' });
  }
});

// 7. Resubmit a rejected listing (landlord) — moves it back to 'pending'
app.patch('/api/properties/:id/resubmit', authenticateToken, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ error: 'Property not found.' });
    if (!property.landlordId || property.landlordId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'You can only resubmit your own properties' });
    }
    if (property.verificationStatus !== 'rejected') {
      return res.status(400).json({ error: 'Only rejected listings can be resubmitted' });
    }
    property.verificationStatus = 'pending';
    property.rejectionReason = '';
    const updated = await property.save();
    res.json({ message: 'Listing resubmitted for review', property: updated });
  } catch (error) {
    console.error('Resubmit error:', error);
    res.status(500).json({ error: 'Server error resubmitting listing.' });
  }
});

// ADMIN ROUTES

// List properties for moderation (optionally filter by status)
app.get('/api/admin/listings', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.verificationStatus = status;
    }
    const properties = await Property.find(filter)
      .populate('landlordId', 'fullName email phoneNumber')
      .sort({ createdAt: -1 });
    res.json(properties);
  } catch (error) {
    console.error('Admin list error:', error);
    res.status(500).json({ error: 'Server error fetching listings.' });
  }
});

// Admin: counters for the overview screen
app.get('/api/admin/stats', authenticateAdmin, async (req, res) => {
  try {
    const [pending, approved, rejected, total, landlords] = await Promise.all([
      Property.countDocuments({ verificationStatus: 'pending' }),
      Property.countDocuments({ verificationStatus: 'approved' }),
      Property.countDocuments({ verificationStatus: 'rejected' }),
      Property.countDocuments({}),
      User.countDocuments({ userType: 'landlord' })
    ]);
    res.json({ pending, approved, rejected, total, landlords });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Server error fetching stats.' });
  }
});

// Admin: approve a listing
app.patch('/api/admin/listings/:id/approve', authenticateAdmin, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ error: 'Property not found.' });
    property.verificationStatus = 'approved';
    property.rejectionReason = '';
    const updated = await property.save();
    res.json({ message: 'Listing approved', property: updated });
  } catch (error) {
    console.error('Approve error:', error);
    res.status(500).json({ error: 'Server error approving listing.' });
  }
});

// Admin: reject a listing with a reason
app.patch('/api/admin/listings/:id/reject', authenticateAdmin, async (req, res) => {
  try {
    const { reason } = req.body || {};
    if (!reason || !String(reason).trim()) {
      return res.status(400).json({ error: 'A rejection reason is required' });
    }
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ error: 'Property not found.' });
    property.verificationStatus = 'rejected';
    property.rejectionReason = String(reason).trim();
    const updated = await property.save();
    res.json({ message: 'Listing rejected', property: updated });
  } catch (error) {
    console.error('Reject error:', error);
    res.status(500).json({ error: 'Server error rejecting listing.' });
  }
});

// Admin: Get all landlords (with optional status filter)
app.get('/api/admin/landlords', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { userType: 'landlord' };
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.verificationStatus = status;
    }
    const landlords = await User.find(filter).sort({ createdAt: -1 });
    res.json(landlords);
  } catch (error) {
    console.error('Admin landlords list error:', error);
    res.status(500).json({ error: 'Server error fetching landlords.' });
  }
});

// Admin: approve a landlord
app.patch('/api/admin/landlords/:id/approve', authenticateAdmin, async (req, res) => {
  try {
    const landlord = await User.findById(req.params.id);
    if (!landlord || landlord.userType !== 'landlord') return res.status(404).json({ error: 'Landlord not found.' });
    
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { verificationStatus: 'approved', isVerified: true, rejectionReason: '' },
      { new: true }
    );
    res.json({ message: 'Landlord approved', user: updated });
  } catch (error) {
    console.error('Approve landlord error:', error);
    res.status(500).json({ error: 'Server error approving landlord.' });
  }
});

// Admin: reject a landlord
app.patch('/api/admin/landlords/:id/reject', authenticateAdmin, async (req, res) => {
  try {
    const { reason } = req.body || {};
    if (!reason || !String(reason).trim()) {
      return res.status(400).json({ error: 'A rejection reason is required' });
    }
    const landlord = await User.findById(req.params.id);
    if (!landlord || landlord.userType !== 'landlord') return res.status(404).json({ error: 'Landlord not found.' });
    
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { verificationStatus: 'rejected', isVerified: false, rejectionReason: String(reason).trim() },
      { new: true }
    );
    res.json({ message: 'Landlord rejected', user: updated });
  } catch (error) {
    console.error('Reject landlord error:', error);
    res.status(500).json({ error: 'Server error rejecting landlord.' });
  }
});

// Admin: update landlord subscription
app.patch('/api/admin/landlords/:id/subscription', authenticateAdmin, async (req, res) => {
  try {
    const { tier } = req.body;
    if (!['none', 'regular', 'premium'].includes(tier)) {
      return res.status(400).json({ error: 'Invalid subscription tier' });
    }

    const landlord = await User.findById(req.params.id);
    if (!landlord || landlord.userType !== 'landlord') return res.status(404).json({ error: 'Landlord not found.' });

    landlord.subscriptionTier = tier;

    if (tier === 'none') {
      landlord.subscriptionExpiry = null;
      // Hide all properties and remove boost; verification stays per-property (admin-only)
      await Property.updateMany({ landlordId: landlord._id }, { 
        isHidden: true, isBoosted: false
      });
    } else {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);
      landlord.subscriptionExpiry = expiry;

      if (tier === 'regular') {
        // Show properties, no boost; verification stays per-property (admin-only)
        await Property.updateMany({ landlordId: landlord._id }, { 
          isHidden: false, isBoosted: false
        });
      } else if (tier === 'premium') {
        // Show + boost properties; verification stays per-property (admin-only)
        await Property.updateMany({ landlordId: landlord._id }, { 
          isHidden: false, isBoosted: true
        });
      }
    }

    await landlord.save();
    res.json({ message: 'Subscription updated', user: landlord });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({ error: 'Server error updating subscription.' });
  }
});

// Get current user (for refreshing state)
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching user details' });
  }
});

// 8. Seeding Route (to easily populate mock data for testing)
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
        verificationStatus: 'approved',
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
        verificationStatus: 'approved',
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
        verificationStatus: 'approved',
        images: ["https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=600&q=80"]
      }
    ];

    const seeded = await Property.insertMany(mockData);
    res.json({ message: 'Database successfully seeded!', count: seeded.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// Subscription & Paymongo Routes
// ==========================================

// Create a Paymongo checkout link for subscription
app.post('/api/subscriptions/checkout', authenticateToken, async (req, res) => {
  try {
    const { targetTier } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user || user.userType !== 'landlord') {
      return res.status(403).json({ error: 'Only landlords can purchase subscriptions.' });
    }

    let amount = 0;
    let description = '';

    if (targetTier === 'regular') {
      amount = 300;
      description = 'Regular Landlord Subscription (30 Days)';
    } else if (targetTier === 'premium') {
      if (user.subscriptionTier === 'regular') {
        amount = 129; // Upgrade from regular
        description = 'Upgrade to Premium Landlord Subscription (30 Days)';
      } else {
        amount = 429;
        description = 'Premium Landlord Subscription (30 Days)';
      }
    } else {
      return res.status(400).json({ error: 'Invalid subscription tier.' });
    }

    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY + ':').toString('base64')}`
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: amount * 100, // Amount in centavos
            description: description,
            remarks: `Landlord ${userId}`,
          }
        }
      })
    };

    const response = await fetch('https://api.paymongo.com/v1/links', options);
    const pmData = await response.json();

    if (!response.ok) {
      console.error('Paymongo error:', pmData);
      return res.status(500).json({ error: 'Failed to create payment link' });
    }

    user.paymongoSubscriptionLinkId = pmData.data.id;
    user.paymongoSubscriptionTargetTier = targetTier;
    await user.save();

    res.json({ checkoutUrl: pmData.data.attributes.checkout_url });
  } catch (error) {
    console.error('Subscription checkout error:', error);
    res.status(500).json({ error: 'Server error processing checkout.' });
  }
});

// Verify subscription payment
app.post('/api/subscriptions/verify-payment', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    
    if (!user || !user.paymongoSubscriptionLinkId) {
      return res.status(400).json({ error: 'No active subscription checkout found.' });
    }

    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        authorization: `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY + ':').toString('base64')}`
      }
    };

    const response = await fetch(`https://api.paymongo.com/v1/links/${user.paymongoSubscriptionLinkId}`, options);
    const pmData = await response.json();

    if (pmData.data && pmData.data.attributes.status === 'paid') {
      const tier = user.paymongoSubscriptionTargetTier;
      user.subscriptionTier = tier;
      
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);
      user.subscriptionExpiry = expiry;
      
      user.paymongoSubscriptionLinkId = null;
      user.paymongoSubscriptionTargetTier = null;
      
      // Update property visibility/boost only; verification stays per-property (admin-only)
      if (tier === 'regular') {
        await Property.updateMany({ landlordId: user._id }, { 
          isHidden: false, isBoosted: false
        });
      } else if (tier === 'premium') {
        await Property.updateMany({ landlordId: user._id }, { 
          isHidden: false, isBoosted: true
        });
      }

      await user.save();
      return res.json({ success: true, user });
    } else {
      return res.json({ success: false, status: pmData.data?.attributes?.status || 'unpaid' });
    }
  } catch (error) {
    console.error('Verify subscription error:', error);
    res.status(500).json({ error: 'Server error verifying payment.' });
  }
});

// ==========================================
// Booking & Paymongo Routes
// ==========================================

// Create a Paymongo checkout link
app.post('/api/bookings/checkout', authenticateToken, async (req, res) => {
  try {
    const { propertyId, landlordId, moveInDate, durationMonths, message, totalPrice } = req.body;
    const studentId = req.user.userId;

    // Create Paymongo link
    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY + ':').toString('base64')}`
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: totalPrice * 100, // Amount in centavos
            description: `Reservation Deposit for Property`,
            remarks: `Property ${propertyId}`,
          }
        }
      })
    };

    const response = await fetch('https://api.paymongo.com/v1/links', options);
    const pmData = await response.json();

    if (!response.ok) {
      console.error('Paymongo error:', pmData);
      return res.status(500).json({ error: 'Failed to create payment link' });
    }

    const checkoutUrl = pmData.data.attributes.checkout_url;
    const paymongoSessionId = pmData.data.id;

    // Create booking as payment_pending
    const booking = new Booking({
      propertyId,
      studentId,
      landlordId,
      moveInDate,
      durationMonths,
      message,
      totalPrice,
      paymongoSessionId,
      checkoutUrl,
      status: 'payment_pending'
    });
    await booking.save();

    res.json({ checkoutUrl, bookingId: booking._id });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Server error processing checkout.' });
  }
});

// Student manually verifies payment to simulate webhook locally
app.post('/api/bookings/:id/verify-payment', authenticateToken, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    
    if (booking.studentId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Since we are mocking the payment flow without local webhooks, 
    // we'll fetch the link status from Paymongo
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        authorization: `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY + ':').toString('base64')}`
      }
    };

    const response = await fetch(`https://api.paymongo.com/v1/links/${booking.paymongoSessionId}`, options);
    const pmData = await response.json();

    if (pmData.data && pmData.data.attributes.status === 'paid') {
      booking.status = 'pending_landlord_approval';
      await booking.save();
      return res.json({ success: true, status: 'paid' });
    } else {
      return res.json({ success: false, status: pmData.data?.attributes?.status || 'unpaid' });
    }
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Server error verifying payment.' });
  }
});

// Get student's bookings
app.get('/api/bookings/my-bookings', authenticateToken, async (req, res) => {
  try {
    const bookings = await Booking.find({ studentId: req.user.userId })
      .populate('propertyId')
      .populate('landlordId', 'fullName email profileImage')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching bookings.' });
  }
});

// Student cancels a pending reservation
app.delete('/api/bookings/:id', authenticateToken, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    
    if (booking.studentId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this booking' });
    }

    if (booking.status !== 'payment_pending') {
      return res.status(400).json({ error: 'Only pending payments can be cancelled and deleted.' });
    }

    await Booking.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Reservation cancelled successfully.' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Server error cancelling reservation.' });
  }
});

// Get landlord's bookings
app.get('/api/bookings/manage', authenticateToken, async (req, res) => {
  try {
    const bookings = await Booking.find({ landlordId: req.user.userId })
      .populate('propertyId')
      .populate('studentId', 'fullName email profileImage')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching reservations.' });
  }
});

// Landlord updates booking status
app.put('/api/bookings/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.landlordId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const oldStatus = booking.status;
    booking.status = status;
    await booking.save();

    // If approved, decrement property beds
    if (status === 'approved' && oldStatus !== 'approved') {
      const prop = await Property.findById(booking.propertyId);
      if (prop && prop.availableBeds > 0) {
        prop.availableBeds -= 1;
        await prop.save();
      }
    }

    // If cancelled/rejected after being approved, increment beds back
    if ((status === 'rejected' || status === 'cancelled') && oldStatus === 'approved') {
      const prop = await Property.findById(booking.propertyId);
      if (prop) {
        prop.availableBeds += 1;
        await prop.save();
      }
    }

    res.json(booking);
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ error: 'Server error updating booking status.' });
  }
});

httpServer.listen(PORT, () => {
  console.log(`Server & WebSocket are running on http://localhost:${PORT}`);
});




