//istingsController.js
const { ObjectId } = require('mongodb');
const getDb = (req) => req.app.locals.db;
exports.getAllListings = async (req, res) => {
    const db = getDb(req);
    const { category, search } = req.query;
    let query = {};

    if (category) {
        query.category = category;
    }

    if (search) {
        query.name = { $regex: search, $options: 'i' }; 
    }

    try {
        const listings = await db.collection('listings').find(query).sort({ createdAt: -1 }).toArray();
        res.status(200).json(listings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching listings', error });
    }
};

exports.getRecentListings = async (req, res) => {
    const db = getDb(req);
    try {
        const listings = await db.collection('listings').find().sort({ createdAt: -1 }).limit(6).toArray();
        res.status(200).json(listings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching recent listings', error });
    }
};
exports.getListingById = async (req, res) => {
    const db = getDb(req);

    if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: 'Invalid listing ID format' });
    }

    try {
        const listing = await db.collection('listings').findOne({ _id: new ObjectId(req.params.id) });
        if (!listing) return res.status(404).json({ message: 'Listing not found' });
        res.status(200).json(listing);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching listing', error });
    }
};

exports.getMyListings = async (req, res) => {
    const db = getDb(req);
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ message: 'User email is required to fetch listings' });
    }

    try {
        const listings = await db.collection('listings').find({ email }).sort({ createdAt: -1 }).toArray();
        res.status(200).json(listings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user listings', error });
    }
};

// POST a new listing 
exports.addListing = async (req, res) => {
    const db = getDb(req);
    const newListing = { ...req.body, createdAt: new Date() };

    try {
        const result = await db.collection('listings').insertOne(newListing);
        res.status(201).json({ insertedId: result.insertedId, ...newListing });
    } catch (error) {
        res.status(400).json({ message: 'Error adding listing', error });
    }
};

//  multiple listings 
exports.addListings = async (req, res) => {
    const db = req.app.locals.db;
    let newListings = req.body;
    if (!Array.isArray(newListings)) {
        return res.status(400).json({ message: 'Expected an array of listings' });
    }
    newListings = newListings.map(item => ({ ...item, createdAt: new Date() }));

    try {
        const result = await db.collection('listings').insertMany(newListings);
        res.status(201).json({ insertedCount: result.insertedCount, insertedIds: result.insertedIds });
    } catch (error) {
        res.status(400).json({ message: 'Error adding listings', error });
    }
};

exports.updateListing = async (req, res) => {
    const db = getDb(req);
    const { ownerEmail, ...updateData } = req.body;

    if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: 'Invalid listing ID format' });
    }

    try {
        const listing = await db.collection('listings').findOne({ _id: new ObjectId(req.params.id) });
        if (!listing) return res.status(404).json({ message: 'Listing not found' });

        if (listing.email !== ownerEmail) {
            return res.status(403).json({ message: 'Authorization denied: You do not own this listing.' });
        }

        const result = await db.collection('listings').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: updateData }
        );

        res.status(200).json({ message: 'Listing updated successfully', modifiedCount: result.modifiedCount });
    } catch (error) {
        res.status(400).json({ message: 'Error updating listing', error });
    }
};

// DELETE 
exports.deleteListing = async (req, res) => {
    const db = getDb(req);
    const { ownerEmail } = req.body;

    if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: 'Invalid listing ID format' });
    }

    try {
        const listing = await db.collection('listings').findOne({ _id: new ObjectId(req.params.id) });
        if (!listing) return res.status(404).json({ message: 'Listing not found' });

        if (listing.email !== ownerEmail) {
            return res.status(403).json({ message: 'Authorization denied: You do not own this listing.' });
        }

        const result = await db.collection('listings').deleteOne({ _id: new ObjectId(req.params.id) });
        res.status(200).json({ message: 'Listing deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting listing', error });
    }
};
