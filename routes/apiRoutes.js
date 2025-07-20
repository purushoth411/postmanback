const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');


router.get('/getCollections', apiController.getCollections);
router.post('/addCollection', apiController.addCollection);
router.post('/addRequest', apiController.addRequest);
router.get('/getRequestsByCollectionId', apiController.getRequestsByCollectionId);



module.exports = router;
