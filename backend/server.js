const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const { MongoMemoryServer } = require('mongodb-memory-server');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    })
  : null;

app.use(cors());
app.use(express.json());

const vehicleSchema = new mongoose.Schema({
  brand: String,
  model: String,
  year: Number,
  price: Number,
  mileage: Number,
  fuelType: String,
  transmission: String,
  bodyType: String,
  color: String,
  condition: String,
  warranty: String,
  location: String,
  status: { type: String, default: 'Available' },
  featured: { type: Boolean, default: false },
  image: String,
  gallery: [String],
  description: String,
  features: [String],
  ownershipHistory: String,
  inspectionReport: String,
  conditionGrade: String,
  isPublished: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'vehicles' });

const leadSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  message: String,
  vehicleId: String,
  vehicleName: String,
  source: { type: String, default: 'Website' },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'leads' });

const testDriveSchema = new mongoose.Schema({
  customerName: String,
  email: String,
  phone: String,
  vehicleId: String,
  vehicleName: String,
  preferredDate: String,
  preferredTime: String,
  dealership: String,
  status: { type: String, default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'testdrives' });

const reservationSchema = new mongoose.Schema({
  customerName: String,
  email: String,
  phone: String,
  vehicleId: String,
  vehicleName: String,
  depositAmount: Number,
  refundPolicy: String,
  status: { type: String, default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'reservations' });

const Vehicle = mongoose.model('Vehicle', vehicleSchema);
const Lead = mongoose.model('Lead', leadSchema);
const TestDrive = mongoose.model('TestDrive', testDriveSchema);
const Reservation = mongoose.model('Reservation', reservationSchema);

const sampleVehicles = [
  {
    brand: 'BMW', model: '5 Series', year: 2021, price: 42900, mileage: 18600, fuelType: 'Petrol', transmission: 'Automatic', bodyType: 'Sedan', color: 'Black Sapphire', condition: 'Excellent', warranty: '12 months', location: 'Birmingham', status: 'Available', featured: true,
    image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80',
    gallery: ['https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80'],
    description: 'Executive luxury sedan with advanced driver assistance and a refined cabin.',
    features: ['Adaptive cruise', 'Heated seats', '360° camera', 'Connected navigation'],
    ownershipHistory: 'Single owner, full service history',
    inspectionReport: 'Sample inspection report: bodywork excellent / no structural issues / tyres 80% remaining',
    conditionGrade: 'A+',
    isPublished: true
  },
  {
    brand: 'Mercedes', model: 'C-Class', year: 2022, price: 38900, mileage: 15400, fuelType: 'Diesel', transmission: 'Automatic', bodyType: 'Sedan', color: 'Obsidian Black', condition: 'Very Good', warranty: '12 months', location: 'Manchester', status: 'Available', featured: true,
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
    gallery: ['https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1494905998402-395d579af36f?auto=format&fit=crop&w=1200&q=80'],
    description: 'A sleek premium sedan matching business performance with modern comfort.',
    features: ['Keyless entry', 'Panoramic roof', 'Lane assist', 'Wireless charging'],
    ownershipHistory: 'Two owners, manufacturer servicing',
    inspectionReport: 'Sample inspection report: all electronics checked, no paint correction required',
    conditionGrade: 'A',
    isPublished: true
  },
  {
    brand: 'Audi', model: 'Q5', year: 2021, price: 41900, mileage: 22400, fuelType: 'Petrol', transmission: 'Automatic', bodyType: 'SUV', color: 'Nardo Grey', condition: 'Excellent', warranty: '12 months', location: 'London', status: 'Available', featured: true,
    image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=80',
    gallery: ['https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=80'],
    description: 'Practical performance SUV with premium styling and a spacious luxury cabin.',
    features: ['Quattro AWD', 'Virtual cockpit', 'Parking sensors', 'Matrix LED'],
    ownershipHistory: 'One owner, regular maintenance complete',
    inspectionReport: 'Sample inspection report: clean underbody, no current advisories',
    conditionGrade: 'A+',
    isPublished: true
  },
  {
    brand: 'Porsche', model: 'Cayenne', year: 2020, price: 51500, mileage: 27000, fuelType: 'Petrol', transmission: 'Automatic', bodyType: 'SUV', color: 'Carrara White', condition: 'Very Good', warranty: '12 months', location: 'Leeds', status: 'Reserved', featured: false,
    image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80',
    gallery: ['https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80'],
    description: 'Performance SUV combining daily ease with unmistakable sporting character.',
    features: ['Sports chrono', 'Air suspension', 'Premium audio', 'Adaptive headlights'],
    ownershipHistory: 'Two owners, fully maintained',
    inspectionReport: 'Sample inspection report: high-grade mechanical condition, cosmetic wear visible on lower trim',
    conditionGrade: 'A',
    isPublished: true
  },
  {
    brand: 'Jaguar', model: 'F-Pace', year: 2022, price: 44000, mileage: 17200, fuelType: 'Diesel', transmission: 'Automatic', bodyType: 'SUV', color: 'Silverstone', condition: 'Excellent', warranty: '12 months', location: 'Bristol', status: 'Available', featured: false,
    image: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1200&q=80',
    gallery: ['https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1200&q=80'],
    description: 'Luxury performance crossover with a strong torque curve and premium detailing.',
    features: ['Meridian audio', 'Head-up display', 'Driver assist', 'All-wheel drive'],
    ownershipHistory: 'One owner, service records available',
    inspectionReport: 'Sample inspection report: no known faults, tyre and brake wear within normal range',
    conditionGrade: 'A+',
    isPublished: true
  },
  {
    brand: 'Range Rover', model: 'Velar', year: 2021, price: 56900, mileage: 19750, fuelType: 'Diesel', transmission: 'Automatic', bodyType: 'SUV', color: 'Santorini Black', condition: 'Excellent', warranty: '12 months', location: 'Edinburgh', status: 'Available', featured: true,
    image: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=80',
    gallery: ['https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=80'],
    description: 'Sharp urban luxury SUV with commanding presence and a premium interior.',
    features: ['Terrain response', 'Heated seats', '360° camera', 'Voice control'],
    ownershipHistory: 'Single owner, dealer maintained',
    inspectionReport: 'Sample inspection report: high-grade cosmetic finish and fully operational electronics',
    conditionGrade: 'A+',
    isPublished: true
  }
];

const parseList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeVehiclePayload = (body = {}) => ({
  brand: body.brand || 'BMW',
  model: body.model || 'Model',
  year: Number(body.year || 2024),
  price: Number(body.price || 0),
  mileage: Number(body.mileage || 0),
  fuelType: body.fuelType || 'Petrol',
  transmission: body.transmission || 'Automatic',
  bodyType: body.bodyType || 'Sedan',
  color: body.color || 'Black',
  condition: body.condition || 'Excellent',
  warranty: body.warranty || '12 months',
  location: body.location || 'Birmingham',
  status: body.status || 'Available',
  featured: Boolean(body.featured),
  image: body.image || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80',
  gallery: body.gallery ? parseList(body.gallery) : [],
  description: body.description || 'Premium vehicle listing',
  features: parseList(body.features),
  ownershipHistory: body.ownershipHistory || 'Dealer maintained',
  inspectionReport: body.inspectionReport || 'Inspection report available on request',
  conditionGrade: body.conditionGrade || 'A+',
  isPublished: body.isPublished !== false
});

async function initializeDatabase() {
  const uri = process.env.MONGODB_URI;
  try {
    if (uri) {
      await mongoose.connect(uri);
      console.log('MongoDB connected');
    } else {
      const memory = await MongoMemoryServer.create();
      await mongoose.connect(memory.getUri(), { dbName: 'premium-dealership' });
      console.log('In-memory MongoDB connected');
    }
  } catch (err) {
    const memory = await MongoMemoryServer.create();
    await mongoose.connect(memory.getUri(), { dbName: 'premium-dealership' });
    console.log('Fallback memory database connected');
  }

  const count = await Vehicle.countDocuments();
  if (!count) await Vehicle.insertMany(sampleVehicles);
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Premium dealership API online' });
});

app.get('/api/vehicles', async (req, res) => {
  const { brand, bodyType, fuelType, maxPrice, yearMin, yearMax, mileage, location } = req.query;
  const query = { isPublished: true };

  if (brand && brand !== 'All') query.brand = brand;
  if (bodyType && bodyType !== 'All') query.bodyType = bodyType;
  if (fuelType && fuelType !== 'All') query.fuelType = fuelType;
  if (location && location !== 'All') query.location = location;
  if (maxPrice) query.price = { $lte: Number(maxPrice) };
  if (yearMin) query.year = { ...(query.year || {}), $gte: Number(yearMin) };
  if (yearMax) query.year = { ...(query.year || {}), $lte: Number(yearMax) };
  if (mileage) query.mileage = { $lte: Number(mileage) };

  const vehicles = await Vehicle.find(query).sort({ featured: -1, price: 1 });
  res.json(vehicles);
});

app.get('/api/vehicles/:id', async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
  res.json(vehicle);
});

app.get('/api/dashboard', async (req, res) => {
  const [total, available, reserved, featured] = await Promise.all([
    Vehicle.countDocuments(),
    Vehicle.countDocuments({ status: 'Available' }),
    Vehicle.countDocuments({ status: 'Reserved' }),
    Vehicle.countDocuments({ featured: true })
  ]);

  res.json({
    totalVehicles: total,
    availableNow: available,
    reservedNow: reserved,
    featuredCount: featured,
    salesTrend: [12, 18, 15, 22, 27, 31],
    popularModels: [
      { model: 'BMW 5 Series', sells: 17 },
      { model: 'Audi Q5', sells: 14 },
      { model: 'Range Rover Velar', sells: 12 }
    ]
  });
});

app.get('/api/admin', async (req, res) => {
  const [vehicles, leads, testDrives, reservations] = await Promise.all([
    Vehicle.find().sort({ createdAt: -1 }),
    Lead.find().sort({ createdAt: -1 }).limit(10),
    TestDrive.find().sort({ createdAt: -1 }).limit(10),
    Reservation.find().sort({ createdAt: -1 }).limit(10)
  ]);

  res.json({
    vehicles,
    leads,
    testDrives,
    reservations,
    stats: {
      totalInventory: vehicles.length,
      pendingBookings: testDrives.filter((item) => item.status === 'Pending').length,
      reservations: reservations.length,
      leads: leads.length
    }
  });
});

app.post('/api/admin/vehicles', async (req, res) => {
  try {
    const payload = normalizeVehiclePayload(req.body);
    const vehicle = await Vehicle.create(payload);
    res.status(201).json({ message: 'Vehicle added successfully', vehicle });
  } catch (error) {
    res.status(400).json({ message: 'Failed to add vehicle', error: error.message });
  }
});

app.put('/api/admin/vehicles/:id', async (req, res) => {
  try {
    const payload = normalizeVehiclePayload(req.body);
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, payload, { new: true });
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json({ message: 'Vehicle updated successfully', vehicle });
  } catch (error) {
    res.status(400).json({ message: 'Failed to update vehicle', error: error.message });
  }
});

app.delete('/api/admin/vehicles/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Failed to delete vehicle', error: error.message });
  }
});

app.post('/api/leads', async (req, res) => {
  const lead = await Lead.create(req.body);
  res.status(201).json({ message: 'Lead captured successfully', lead });
});

app.post('/api/test-drives', async (req, res) => {
  const testDrive = await TestDrive.create(req.body);
  res.status(201).json({ message: 'Test-drive request received', testDrive });
});

app.post('/api/reservations', async (req, res) => {
  try {
    const reservationData = {
      ...req.body,
      depositAmount: Number(req.body.depositAmount || 2500),
      refundPolicy: 'Refundable deposit'
    };

    const reservation = await Reservation.create(reservationData);

    res.status(201).json({
      message: 'Reservation deposit accepted',
      reservation,
      paymentStatus: 'demo_success',
      checkoutUrl: '/demo-checkout'
    });
  } catch (error) {
    res.status(400).json({ message: 'Failed to create reservation', error: error.message });
  }
});

app.post('/api/payments/create-order', async (req, res) => {
  try {
    const { amount, vehicleName, customerName, email, phone } = req.body;
    const numericAmount = Number(amount || 0);

    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ message: 'Valid payment amount is required' });
    }

    if (!razorpay) {
      return res.status(200).json({
        message: 'Razorpay keys are not configured. Add keys to enable actual payments.',
        paymentStatus: 'keys_missing',
        demo: true,
        amount: numericAmount,
        vehicleName: vehicleName || 'Luxury vehicle',
        customerName: customerName || 'Customer',
        email: email || '',
        phone: phone || ''
      });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(numericAmount * 100),
      currency: 'INR',
      receipt: `vehicle_${Date.now()}`,
      notes: {
        customerName: customerName || 'Customer',
        vehicleName: vehicleName || 'Luxury vehicle',
        email: email || '',
        phone: phone || ''
      }
    });

    res.status(200).json({
      message: 'Razorpay order created',
      paymentStatus: 'order_created',
      amount: numericAmount,
      currency: 'INR',
      order,
      keyId: process.env.RAZORPAY_KEY_ID,
      demo: false
    });
  } catch (error) {
    res.status(400).json({ message: 'Unable to create Razorpay order', error: error.message });
  }
});

app.post('/api/payments/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, reservationData } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment verification data' });
    }

    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isValid = generatedSignature === razorpay_signature;

    if (!isValid) {
      return res.status(400).json({ message: 'Payment verification failed', verified: false });
    }

    const reservation = await Reservation.create({
      ...(reservationData || {}),
      depositAmount: Number((reservationData && reservationData.depositAmount) || 2500),
      refundPolicy: 'Refundable deposit',
      status: 'Confirmed'
    });

    res.status(200).json({
      message: 'Payment verified successfully',
      verified: true,
      reservation
    });
  } catch (error) {
    res.status(400).json({ message: 'Payment verification failed', error: error.message });
  }
});

app.get('/api/notifications', (req, res) => {
  res.json([
    { id: 1, title: 'Booking confirmed', text: 'BMW 5 Series test-drive confirmed for Wednesday 10:30 AM', type: 'success' },
    { id: 2, title: 'Deposit refunded', text: 'Refund initiated for reservation cancellation - 3 working days', type: 'info' },
    { id: 3, title: 'New lead', text: 'Audi Q5 enquiry received from Bristol', type: 'warning' }
  ]);
});

initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
