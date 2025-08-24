const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');

router.get('/getWorkspaces',apiController.getWorkspaces);
router.get('/getCollections', apiController.getCollections);
router.post("/createWorkspace", apiController.createWorkspace);

router.post('/addCollection', apiController.addCollection);
router.post('/addFolder', apiController.addFolder);
router.put('/renameCollection', apiController.renameCollection);
router.delete('/deleteCollection', apiController.deleteCollection);
router.put('/renameFolder', apiController.renameFolder);
router.delete('/deleteFolder', apiController.deleteFolder);
router.put('/renameRequest', apiController.renameRequest);
router.delete('/deleteRequest', apiController.deleteRequest);

router.get('/getRequestsByCollectionId', apiController.getRequestsByCollectionId);
router.get('/getRequestsByFolderId', apiController.getRequestsByFolderId);


router.post('/addRequest', apiController.addRequest);

router.put('/updateRequest/:id', apiController.updateRequest);
router.get('/searchRequests', apiController.searchRequests);



module.exports = router;
