const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  icon: { type: String, required: true },
  color: { type: String, default: 'bg-blue-50 text-primary' },
  description: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  avatar: { type: String, default: '' },
  role: { type: String, enum: ['client', 'provider'], default: 'client' },
  profession: { type: String, default: '' },
  bio: { type: String, default: '' },
  phone: { type: String, default: '' },
  location: { type: String, default: '' },
  specializations: [{ type: String }],
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const providerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  profession: { type: String, required: true },
  bio: { type: String, default: '' },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  completedJobs: { type: Number, default: 0 },
  hourlyRate: { type: Number, default: 0 },
  available: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const serviceRequestSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  serviceType: { type: String, required: true },
  status: { type: String, enum: ['open', 'in_progress', 'completed'], default: 'open' },
  location: { type: String, default: '' },
  budget: { type: Number, default: null },
  preferredDate: { type: Date, default: null },
  preferredTime: { type: String, default: 'anytime' },
  applications: [{
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    message: { type: String, default: '' },
    proposedPrice: { type: Number, default: null },
    createdAt: { type: Date, default: Date.now },
  }],
  acceptedProviderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  completedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Category = mongoose.model('Category', categorySchema);
const User = mongoose.model('User', userSchema);
const Provider = mongoose.model('Provider', providerSchema);
const ServiceRequest = mongoose.model('ServiceRequest', serviceRequestSchema);

const categoriesData = [
  { name: 'Plumber', icon: 'plumbing', color: '#3b82f6', description: 'Pipe repair, installation, and maintenance' },
  { name: 'Electrician', icon: 'bolt', color: '#eab308', description: 'Electrical repairs and installations' },
  { name: 'Painter', icon: 'format_paint', color: '#ec4899', description: 'Interior and exterior painting' },
  { name: 'Carpenter', icon: 'carpenter', color: '#f59e0b', description: 'Wood furniture and framing work' },
  { name: 'Home Cleaner', icon: 'cleaning_services', color: '#8b5cf6', description: 'House cleaning services' },
  { name: 'Mover', icon: 'local_shipping', color: '#22c55e', description: 'Moving and relocation help' },
  { name: 'HVAC Technician', icon: 'ac_unit', color: '#06b6d4', description: 'Heating and cooling systems' },
  { name: 'Landscaper', icon: 'grass', color: '#84cc16', description: 'Garden and lawn maintenance' },
  { name: 'Roofer', icon: 'roofing', color: '#dc2626', description: 'Roof repair and installation' },
  { name: 'Appliance Repair', icon: 'kitchen', color: '#6366f1', description: 'Home appliance repairs' },
];

const bcrypt = require('bcryptjs');

const sampleUsers = [
  { email: 'john@example.com', password: 'password123', name: 'John Smith', role: 'client', bio: 'Homeowner looking for help', location: 'New York, NY' },
  { email: 'sarah@example.com', password: 'password123', name: 'Sarah Johnson', role: 'provider', profession: 'Plumber', bio: 'Licensed plumber with 10 years experience', location: 'Brooklyn, NY', specializations: ['plumbing', 'pipe repair'] },
  { email: 'mike@example.com', password: 'password123', name: 'Mike Williams', role: 'provider', profession: 'Electrician', bio: 'Certified electrician', location: 'Queens, NY', specializations: ['electrical', 'wiring'] },
  { email: 'emily@example.com', password: 'password123', name: 'Emily Brown', role: 'provider', profession: 'Painter', bio: 'Professional painter', location: 'Manhattan, NY', specializations: ['painting', 'interior'] },
  { email: 'david@example.com', password: 'password123', name: 'David Wilson', role: 'provider', profession: 'Carpenter', bio: 'Custom furniture builder', location: 'Bronx, NY', specializations: ['carpentry', 'furniture'] },
];

const sampleRequests = [
  { title: 'Fix leaky kitchen faucet', description: 'My kitchen faucet has been dripping for days. Need a plumber to come take a look.', serviceType: 'plumber', budget: 150, location: 'Brooklyn, NY', preferredTime: 'morning' },
  { title: 'Install new ceiling fan', description: 'Need someone to install a new ceiling fan in my living room.', serviceType: 'electrician', budget: 200, location: 'Manhattan, NY', preferredTime: 'afternoon' },
  { title: 'Paint living room walls', description: 'Looking to paint my living room (about 400 sq ft). Need someone with experience.', serviceType: 'painter', budget: 350, location: 'Queens, NY', preferredTime: 'anytime' },
  { title: 'Build custom bookshelf', description: 'Want a custom bookshelf built for my home office. Have measurements ready.', serviceType: 'carpenter', budget: 500, location: 'Brooklyn, NY', preferredTime: 'weekend' },
  { title: 'Deep house cleaning', description: 'Need deep cleaning for 3-bedroom apartment before moving in.', serviceType: 'cleaner', budget: 200, location: 'Bronx, NY', preferredTime: 'anytime' },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bricouly');
    console.log('Connected to MongoDB');

    await Category.deleteMany({});
    await User.deleteMany({});
    await Provider.deleteMany({});
    await ServiceRequest.deleteMany({});
    console.log('Cleared existing data');

    await Category.insertMany(categoriesData);
    console.log('Seeded categories');

    const hashedPassword = await bcrypt.hash('password123', 10);
    const createdUsers = [];
    
    for (const userData of sampleUsers) {
      const user = await User.create({ ...userData, password: hashedPassword });
      createdUsers.push(user);
      
      if (userData.role === 'provider') {
        await Provider.create({
          user: user._id,
          profession: userData.profession,
          bio: userData.bio,
          rating: Math.random() * 2 + 3,
          reviewCount: Math.floor(Math.random() * 20) + 1,
          completedJobs: Math.floor(Math.random() * 50) + 5,
          hourlyRate: Math.floor(Math.random() * 50) + 30,
        });
      }
    }
    console.log(`Seeded ${createdUsers.length} users`);

    const clients = createdUsers.filter(u => u.role === 'client');
    const providers = createdUsers.filter(u => u.role === 'provider');
    
    const requests = sampleRequests.map((req, i) => ({
      ...req,
      clientId: clients[i % clients.length]._id,
      status: i < 3 ? 'open' : 'completed',
      preferredDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000),
    }));
    
    await ServiceRequest.insertMany(requests);
    console.log(`Seeded ${requests.length} service requests`);

    const categoryCount = await Category.countDocuments();
    const userCount = await User.countDocuments();
    const providerCount = await Provider.countDocuments();
    const requestCount = await ServiceRequest.countDocuments();

    console.log('\n=== Seed Complete ===');
    console.log(`Categories: ${categoryCount}`);
    console.log(`Users: ${userCount}`);
    console.log(`Providers: ${providerCount}`);
    console.log(`Service Requests: ${requestCount}`);
    console.log('\nTest accounts:');
    console.log('  Client: john@example.com / password123');
    console.log('  Provider: sarah@example.com / password123');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();