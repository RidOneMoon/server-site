
const express = require('express');
const router = express.Router();
const listingsController = require('../controllers/listingsController');


router.get('/recent', listingsController.getRecentListings); 


// Pub
router.get('/:id',(req, res, next) => {
    console.log("get list by id running ");
    next()
} ,listingsController.getListingById); 


router.post('/add',listingsController.addListing);
router.get('/', listingsController.getAllListings); 




// Pri
router.get('/lists/:email', listingsController.getMyListings); 


router.put('/:id', listingsController.updateListing); 
router.delete('/:id', listingsController.deleteListing); 

module.exports = router;
