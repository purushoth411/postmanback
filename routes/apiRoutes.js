const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');
const { validateInput, checkValidation } = require('../middleware/validate');


router.get('/getWorkspaces',apiController.getWorkspaces);
router.get('/searchUsers', apiController.searchUsers);
router.get('/getCollections', apiController.getCollections);
router.post("/createWorkspace", apiController.createWorkspace);
router.get('/getWorkspaceDetails', apiController.getWorkspaceDetails);
router.put('/updateWorkspace', apiController.updateWorkspace);
router.delete('/deleteWorkspace', apiController.deleteWorkspace);

router.post('/addCollection',validateInput.collection, checkValidation, apiController.addCollection);
router.post('/addFolder',validateInput.folder, checkValidation, apiController.addFolder);
router.put('/renameCollection',validateInput.collection, checkValidation, apiController.renameCollection);
router.delete('/deleteCollection', apiController.deleteCollection);
router.put('/renameFolder',validateInput.folder, checkValidation, apiController.renameFolder);
router.delete('/deleteFolder', apiController.deleteFolder);
router.put('/renameRequest',validateInput.request, checkValidation, apiController.renameRequest);
router.delete('/deleteRequest', apiController.deleteRequest);

router.get('/getRequestsByCollectionId', apiController.getRequestsByCollectionId);
router.get('/getRequestsByFolderId', apiController.getRequestsByFolderId);
router.get('/getRequest', apiController.getRequestsByRequestId);


router.post('/addRequest',validateInput.request, checkValidation, apiController.addRequest);

router.put('/updateRequest',validateInput.request, checkValidation, apiController.updateRequest);
router.get('/searchRequests', apiController.searchRequests);


router.post("/saveRequest", apiController.saveRequest);

router.get('/getEnvironments', apiController.getEnvironments);
router.get('/getActiveEnvironment', apiController.getActiveEnvironment);
router.post('/addEnvironment',validateInput.environment, checkValidation, apiController.addEnvironment);
router.post('/setActiveEnvironment', apiController.setActiveEnvironment);
router.put('/updateEnvironment',validateInput.environment, checkValidation, apiController.updateEnvironment);
router.delete('/deleteEnvironment', apiController.deleteEnvironment);

// Environment Variables
router.get('/getEnvironmentVariables', apiController.getEnvironmentVariables);
router.post('/addEnvironmentVariable',validateInput.environmentVariable, checkValidation, apiController.addEnvironmentVariable);
router.put('/updateEnvironmentVariable',validateInput.environmentVariable, checkValidation, apiController.updateEnvironmentVariable);
router.delete('/deleteEnvironmentVariable', apiController.deleteEnvironmentVariable);

// Global Variables
router.get('/getGlobalVariables', apiController.getGlobalVariables);
router.post('/addGlobalVariable',validateInput.globalVariable, checkValidation, apiController.addGlobalVariable);
router.put('/updateGlobalVariable',validateInput.globalVariable, checkValidation, apiController.updateGlobalVariable);
router.delete('/deleteGlobalVariable', apiController.deleteGlobalVariable);




module.exports = router;
