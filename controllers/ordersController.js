
const getDb = (req) => req.app.locals.db;
exports.addOrder = async (req, res) => {
    const db = getDb(req);
    const newOrder = { ...req.body, orderedAt: new Date() };

    try {
        const result = await db.collection('orders').insertOne(newOrder);
        res.status(201).json({ insertedId: result.insertedId, ...newOrder });
    } catch (error) {
        res.status(400).json({ message: "Error adding order", error });
    }
};

exports.addOrders = async (req, res) => {
    const db = getDb(req);
    let newOrders = req.body;

    // Check 
    if (!Array.isArray(newOrders)) {
        return res.status(400).json({ message: "Expected an array of orders" });
    }

    newOrders = newOrders.map(order => ({ ...order, orderedAt: new Date() }));

    try {
        const result = await db.collection('orders').insertMany(newOrders);
        res.status(201).json({ insertedCount: result.insertedCount, insertedIds: result.insertedIds });
    } catch (error) {
        res.status(400).json({ message: "Error adding orders", error });
    }
};


exports.getMyOrders = async (req, res) => {
    const db = getDb(req);
    const { email } = req.query;


    if (!email) {
        return res.status(400).json({ message: 'User email is required to fetch orders' });
    }

    try {
        const orders = await db.collection('orders')
            .find({ email: email })
            .sort({ orderedAt: -1 })
            .toArray();


        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user orders', error });
    }
};
