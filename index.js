require('dotenv').config(); 

const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const listingRoutes = require('./routes/listingRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
const port = process.env.PORT || 3000;
const uri = process.env.DATABASE_URL;
const dbName = process.env.DATABASE_NAME;

if (!uri || !dbName) {
  console.error("ERROR: DATABASE_URL .");
  process.exit(1);
}


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// --- Middleware ---
app.use(cors({
  origin: ['http://localhost:5173', 'YOUR_CLIENT_LIVE_URL'], //  frontend URL
  credentials: true,
}));
app.use(express.json());


async function connectToMongoDBAndStartServer() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Mongo connect successfully!");

    const db = client.db(dbName);
    app.locals.db = db;
    app.use('/api/listings', listingRoutes);
    app.use('/api/orders', orderRoutes);

    app.get('/', (req, res) => {
      res.send(' PawMart Server is running and ready for API requests.');
    });

  
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).send('Something broke on the PawMart server!');
    });

  
    app.listen(port, () => {
      console.log(`PawMart Server listening at http://localhost:${port}`);
    });

  } catch (error) {
    console.error("Failed to connect to DB or start server:", error);
    process.exit(1);
  }
}

connectToMongoDBAndStartServer();
process.on('SIGINT', async () => {
  console.log('\nServer shutting down...');
  await client.close();
  console.log('MongoDB connection closed.');
  process.exit(0);
});
