const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');

router.get('/getWorkspaces',apiController.getWorkspaces);
router.get('/getCollections', apiController.getCollections);
router.post("/createWorkspace", apiController.createWorkspace);
router.get('/getWorkspaceDetails', apiController.getWorkspaceDetails);
router.put('/updateWorkspace', apiController.updateWorkspace);
router.delete('/deleteWorkspace', apiController.deleteWorkspace);

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
router.get('/getRequest', apiController.getRequestsByRequestId);


router.post('/addRequest', apiController.addRequest);

router.put('/updateRequest', apiController.updateRequest);
router.get('/searchRequests', apiController.searchRequests);


router.post("/saveRequest", apiController.saveRequest);

router.get('/getEnvironments', apiController.getEnvironments);
router.get('/getActiveEnvironment', apiController.getActiveEnvironment);
router.post('/addEnvironment', apiController.addEnvironment);
router.post('/setActiveEnvironment', apiController.setActiveEnvironment);
router.put('/updateEnvironment', apiController.updateEnvironment);
router.delete('/deleteEnvironment', apiController.deleteEnvironment);

// Environment Variables
router.get('/getEnvironmentVariables', apiController.getEnvironmentVariables);
router.post('/addEnvironmentVariable', apiController.addEnvironmentVariable);
router.put('/updateEnvironmentVariable', apiController.updateEnvironmentVariable);
router.delete('/deleteEnvironmentVariable', apiController.deleteEnvironmentVariable);

// Global Variables
router.get('/getGlobalVariables', apiController.getGlobalVariables);
router.post('/addGlobalVariable', apiController.addGlobalVariable);
router.put('/updateGlobalVariable', apiController.updateGlobalVariable);
router.delete('/deleteGlobalVariable', apiController.deleteGlobalVariable);




module.exports = router;
