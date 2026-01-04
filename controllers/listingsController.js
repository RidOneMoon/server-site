 
const { ObjectId } = require('mongodb');

const getDb = (req) => req.app.locals.db;

 
exports.getAllListings = async (req, res) => {
  const db = getDb(req);

  try {
    const { 
      category, 
      search, 
      sortBy = 'createdAt', 
      order = 'desc', 
    } = req.query;

    const recent = req.query.recent;

    const query = {};

 
    if (category && typeof category === 'string') {
      query.category = category.trim();
    }


      if (recent === "true") {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      query.createdAt = { $gte: startOfMonth };
    }
   
    if (search && typeof search === 'string') {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.name = { $regex: escapedSearch, $options: 'i' };
    }

    const sortDirection = order === 'asc' ? 1 : -1;



    let cursor = db.collection('listings')
      .find(query, {
        projection: {
          _id: 1,
          name: 1,
          category: 1,
          price: 1,
          image: 1,
          date: 1,
          createdAt: 1
        }
      })
      .sort({ [sortBy]: sortDirection });

    

    const listings = await cursor.toArray();

    // console.log(listings)

    res.status(200).json({
      success: true,
      count: listings.length,
      data: listings,
    });

  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching listings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};



// Get Recent lists
exports.getRecentListings = async (req, res) => {
    const db = getDb(req);
    try {
        const listings = await db.collection('listings').find().sort({ createdAt: -1 }).limit(6).toArray();
        res.status(200).json(listings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching recent listings', error });
    }
};

// Get Single list
exports.getListingById = async (req, res) => {
    const db = getDb(req);

    const id = req.params.id;

    console.log("silngle list id ", id)
    
    // 1. ID Validation Check
    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid listing ID format' });
    }

    try {
        // 2. Database Query
        const listing = await db.collection('listings').findOne({ _id: new ObjectId(id) });

        // 3. FIX: Handle Listing Not Found (404)
        if (!listing) {
            console.log("not found ");
            
            // Changed status from 204 to 404 Not Found 
            return res.status(404).json({ 
                success: false,
                message: 'Listing not found',
                // For 404, we typically just send the message, 
                // but keeping list: {} ensures the client always gets the expected structure.
                list: {} 
            });
        }

        // 4. Success Response (200 OK)
        return res.status(200).json({
            success: true,
            message: "Get list successfully",
            list: listing
        });
        
    } catch (error) {
        // 5. Server Error Response (500)
        console.error("Error fetching listing:", error);
        res.status(500).json({ 
            message: 'Error fetching listing', 
            error: error.message || error
        });
    }
};


// Get lists for admin
exports.getMyListings = async (req, res) => {
    const db = getDb(req);
    // Correctly get email from URL parameters
    const { email } = req.params; 

    // console.log("email", email);

    if (!email) {
        // This check is redundant because the route structure ensures an email is present,
        // but it's good practice.
        return res.status(400).json({ message: 'User email is required to fetch listings' });
    }

    try {
        const listings = await db.collection('listings').find({ email }).sort({ createdAt: -1 }).toArray();
        
        // FIX 3: Check if the array is empty
        if (listings.length === 0) {
            // Use 404 (Not Found) or 200 (OK) with an empty list for "no listings"
            return res.status(200).json({ 
                success: true,
                message: "No listings found for this user.",
                lists: []
            });
        }
        
        // Success case
        return res.status(200).json({
            success: true,
            message: "Successfully retrieved listings",
            lists: listings
        });
        
    } catch (error) {
        console.error("Error in getMyListings:", error);
        // Use 500 for actual server/database errors
        res.status(500).json({ message: 'Error fetching user listings', error: error.message || error });
    }
};

// POST a new listing 
exports.addListing = async (req, res) => {
   const itemData = req.body;
    const db = getDb(req);

    // console.log("body ", itemData)
   
    if (Object.values(itemData).some(value => !value)) {
        return res.status(400).json({ message: "All item fields are required!" });
    }

    // --- Insertion Logic ---
    try {
        // 1. Get the 'listings' collection
        const listingsCollection = db.collection('listings'); 
        
      

        // 2. Insert the itemData into the collection
        const result = await listingsCollection.insertOne({
            ...itemData,
            createdAt: new Date(),
        });

        // 3. Respond with success status and the inserted document's ID
        if (result.acknowledged) {
             const newItem = await listingsCollection.findOne({ _id: result.insertedId });

             res.status(201).json({ 
                success: true,
                message: "Listing created successfully!",
                item: newItem 
             });
        } else {
            res.status(500).json({ message: "Failed to create listing." });
        }

    } catch (error) {
        // Log the error for debugging purposes
        console.error("Error creating listing:", error);
        
        // Send a generic server error response
        res.status(500).json({ message: "Internal Server Error." });
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
    const { id } = req.params;

    // console.log("deleting running ")

    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid listing ID format' });
    }

    try {
        const result = await db.collection('listings').deleteOne({ _id: new ObjectId(id) });
        res.status(200).json({ message: 'Listing deleted successfully', data: result });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting listing', error });
    }
};
