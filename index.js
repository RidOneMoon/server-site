
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


let cachedDb = null;


async function connectToMongoDB() {
    if (cachedDb) {
        console.log("Using cached MongoDB connection.");
        return cachedDb;
    }
    
    if (!uri || !dbName) {
        console.error("ERROR: DATABASE_URL: Database uri or db name not found");
        throw new Error("Missing database configuration.");
    }

    const client = new MongoClient(uri, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        },
        
        maxPoolSize: 50, 
        minPoolSize: 1 
    });

    await client.connect();
    cachedDb = client.db(dbName);
    console.log("Mongo connect successfully!");
    return cachedDb;
}


// --- MIDDLEWARE SETUP ---


const allowedOrigins = [
    "https://spectacular-melba-31fcf7.netlify.app",
    "http://localhost:5173",
    "https://stalwart-mermaid-3e5896.netlify.app",
    "https://graceful-longma-c3a788.netlify.app",
    "https://endearing-twilight-62c861.netlify.app",
    "https://inquisitive-maamoul-336fa5.netlify.app",
    "https://statuesque-monstera-2654e4.netlify.app",
    "https://lighthearted-kulfi-5c694d.netlify.app"
    
];

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

app.use(express.json());


app.options(/.*/, cors({
    origin: allowedOrigins,
    credentials: true
}));


app.use(async (req, res, next) => {
    try {
        const db = await connectToMongoDB();
        req.app.locals.db = db; 
        next();
    } catch (error) {
        console.error("Database connection failed:", error.message);
        res.status(503).send('Database connection unavailable.');
    }
});


// --- ROUTES ---

// --- USER ROUTES ADDED FOR DASHBOARD ---
app.post('/api/users', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const user = req.body;
        const usersCollection = db.collection("users");
        const query = { email: user.email };
        const options = { upsert: true };
        const updateDoc = {
            $set: {
                name: user.name,
                email: user.email,
                photoURL: user.photoURL,
                role: user.role || 'user'
            },
        };
        const result = await usersCollection.updateOne(query, updateDoc, options);
        res.status(200).send(result);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const usersCollection = db.collection("users");
        const result = await usersCollection.find().toArray();
        res.status(200).send(result);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});
// ---------------------------------------

app.use('/api/listings', listingRoutes);
app.use('/api/orders', orderRoutes);

app.get('/', (req, res) => {
    res.send('PawMart Server is running and ready for API requests.');
});

// --- ERROR HANDLER ---
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke on the PawMart server!');
});


// --- CONDITIONAL LOCAL STARTUP BLOCK ---
if (require.main === module) {
    
    connectToMongoDB()
        .then(() => {
            
            app.listen(port, () => {
                console.log(`\nPawMart Server is running locally at http://localhost:${port}`);
            });
        })
        .catch(error => {
            
            console.error("\nFATAL ERROR during local startup:", error.message);
            process.exit(1);
        });
}


module.exports = app;