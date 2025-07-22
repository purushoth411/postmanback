const { get } = require('http');
const apiModel = require('../models/apiModel');

const addCollection = (req, res) => {
  try{
    const { user_id, name } = req.body;

  if (!user_id || !name) {
    return res.status(400).json({ status: false, message: 'user_id and name are required' });
  }

  apiModel.addCollection(user_id, name, (err, result) => {
    if (err) {
      console.error('Error creating collection:', err);
      return res.status(500).json({ status: false, message: 'Database error' });
    }

    return res.status(201).json({
      status: true,
      message: 'Collection added successfully',
      collection_id: result.insertId,
      name
    });
  });
  }catch (error) {
    console.error("Error in getCollections:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

const getCollections = (req, res) => {
  try{
    const user_id = req.query.user_id;

  if (!user_id) {
    return res.status(400).json({ status: false, message: "Missing user_id" });
  }

  apiModel.getCollectionsByUser(user_id, (err, collections) => {
    if (err) {
      console.error("Error fetching collections:", err);
      return res.status(500).json({ status: false, message: "Server error" });
    }

    return res.status(200).json(collections);
  });
  }catch (error) {
    console.error("Error in getCollections:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

const addRequest = (req, res) => {
  const { collection_id, name, method, url, body } = req.body;
  const user_id = req.session?.user?.id || req.body.user_id;

  if (!user_id || !collection_id || !name || !method) {
    return res.status(400).json({ status: false, message: "Missing required fields" });
  }

  const requestData = {
    collection_id,
    user_id,
    name,
    method,
    url: url || '',
    body: body || ''
  };

  apiModel.addRequest(requestData, (err, insertId) => {
    if (err) {
      console.error("DB Insert Error:", err);
      return res.status(500).json({ status: false, message: "Database insert error" });
    }

    apiModel.getRequestById(insertId, (fetchErr, request) => {
      if (fetchErr || !request) {
        console.error("DB Fetch Error:", fetchErr);
        return res.status(500).json({ status: false, message: "Failed to retrieve newly inserted request" });
      }

      res.json({
        status: true,
        message: "Request added successfully",
        request
      });
    });
  });
};

const getRequestsByCollectionId = (req, res) => {
  const collection_id = req.query.collection_id;

  if (!collection_id) {
    return res.status(400).json({ status: false, message: "Missing collection_id" });
  }

  apiModel.getRequestsByCollectionId(collection_id, (err, results) => {
    if (err) {
      console.error("Error fetching requests:", err);
      return res.status(500).json({ status: false, message: "Database error" });
    }

    return res.json({
      status: true,
      requests: results
    });
  });
};

const updateRequest = (req, res) => {
  const id = req.params.id;
  const changes = req.body;

  if (!id) {
    return res.status(400).json({ status: false, message: "Missing request id" });
  }

  if (!changes || Object.keys(changes).length === 0) {
    return res.status(400).json({ status: false, message: "No update data provided" });
  }

  apiModel.updateRequest( id, changes, (err, results) => {
    if (err) {
      console.error("Model error:", err);
      return res.status(500).json({ status: false, message: "Database update failed" });
    }

    return res.json({ status: true, message: "Request updated", results });
  });
};

module.exports = {
  addCollection,
  getCollections,
  addRequest,
  getRequestsByCollectionId,
  updateRequest
};
