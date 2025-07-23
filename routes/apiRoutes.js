const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');


router.get('/getCollections', apiController.getCollections);
router.post('/addCollection', apiController.addCollection);
router.post('/addFolder', apiController.addFolder);
router.put('/renameCollection', apiController.renameCollection);
router.delete('/deleteCollection', apiController.deleteCollection);

router.get('/getRequestsByCollectionId', apiController.getRequestsByCollectionId);
router.get('/getRequestsByFolderId', apiController.getRequestsByFolderId);


router.post('/addRequest', apiController.addRequest);

router.put('/updateRequest/:id', apiController.updateRequest);



module.exports = router;
