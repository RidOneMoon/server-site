
const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/ordersController');



// Pri
router.post('/', ordersController.addOrder); 
router.post('/batch',ordersController.addOrders)
 

module.exports = router;