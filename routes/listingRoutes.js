
const express = require('express');
const router = express.Router();
const listingsController = require('../controllers/listingsController');

// Pub
router.get('/', listingsController.getAllListings); 
router.get('/recent', listingsController.getRecentListings); 
router.get('/:id', listingsController.getListingById); 

// Pri
router.post('/', listingsController.addListing); 
router.post('/batch', listingsController.addListings); 
router.get('/my-listings', listingsController.getMyListings); 
router.put('/:id', listingsController.updateListing); 
router.delete('/:id', listingsController.deleteListing); 

module.exports = router;
