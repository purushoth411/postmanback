// routes/helperRoutes.js
const express = require('express');
const router = express.Router();
const helperController = require('../controllers/helperController');

router.post('/getRemarks', helperController.getRemarks);
router.post('/getHistory', helperController.getHistory);
router.post('/getReminders', helperController.getReminders);

router.post("/updateFollower", helperController.updateFollower);
router.post("/updateTags", helperController.updateTags);
router.post("/markAsOngoing", helperController.markAsOngoing);
router.post("/markAsCompleted", helperController.markAsCompleted);
router.post("/transferTask", helperController.transferTask);

router.post("/getTaskMilestones", helperController.getTaskMilestones);


router.get('/alltags', helperController.getAllTags);
router.get('/allothertags', helperController.getAllOtherTags);
router.get('/allbenchmarks', helperController.getAllBenchmarks);
router.get('/allprojects', helperController.getAllProjects);
router.get('/allbuckets', helperController.getAllBuckets);
router.get('/allrequirements', helperController.getAllRequirements);
router.get('/allcurrency', helperController.getAllCurrency);

router.get('/allteams', helperController.getAllTeams);
router.put('/team/update/:id', helperController.updateTeam);
router.post('/team/create', helperController.createTeam);
router.delete('/team/delete/:id', helperController.deleteTeam);


router.post('/tag/create', helperController.addTag);
router.put('/tag/update/:id', helperController.updateTag);
router.delete('/tag/delete/:id', helperController.deleteTag);

router.post('/bucket/create', helperController.addBucket);
router.put('/bucket/update/:id', helperController.updateBucket);
router.delete('/bucket/delete/:id', helperController.deleteBucket);

router.post('/benchmark/create', helperController.addBenchmark);
router.put('/benchmark/update/:id', helperController.updateBenchmark);
router.delete('/benchmark/delete/:id', helperController.deleteBenchmark);



router.post('/project/create', helperController.addProject);
router.put('/project/update/:id', helperController.updateProject);
router.delete('/project/delete/:id', helperController.deleteProject);


router.post('/requirement/create', helperController.addRequirement);
router.put('/requirement/update/:id', helperController.updateRequirement);
router.delete('/requirement/delete/:id', helperController.deleteRequirement);

router.post('/currency/create', helperController.addCurrency);
router.put('/currency/update/:id', helperController.updateCurrency);
router.delete('/currency/delete/:id', helperController.deleteCurrency);

router.post('/othertags/create', helperController.addOtherTag);
router.put('/othertags/update/:id', helperController.updateOtherTag);
router.delete('/othertags/delete/:id', helperController.deleteOtherTag);

module.exports = router;
