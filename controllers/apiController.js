const { get } = require('http');
const apiModel = require('../models/apiModel');

const addCollection = (req, res) => {
  try{
    const { user_id,wks_id, name } = req.body;

  if (!user_id || !name || !wks_id) {
    return res.status(400).json({ status: false, message: 'user_id and name are required' });
  }

  apiModel.addCollection(user_id,wks_id, name, (err, result) => {
    if (err) {
      console.error('Error creating collection:', err);
      return res.status(500).json({ status: false, message: 'Database error' });
    }
    apiModel.getCollectionById(result.insertId,(err,collection)=>{
       if (err) {
      console.error('Error in getting  collection:', err);
      return res.status(500).json({ status: false, message: 'Database error' });
    }
   

        return res.status(201).json({
          status: true,
          message: 'Collection added successfully',
          collection: collection,
          name
        });
     })
  });
  }catch (error) {
    console.error("Error in getCollections:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

const addFolder = (req, res) => {
  try {
    const { user_id, name, collection_id, parent_folder_id = null } = req.body;

    if (!user_id || !name || !collection_id) {
      return res.status(400).json({ status: false, message: 'Missing required fields' });
    }

    apiModel.addFolder(user_id, collection_id, parent_folder_id, name, (err, result) => {
      if (err) {
        console.error('Error creating folder:', err);
        return res.status(500).json({ status: false, message: 'Database error' });
      }

      return res.status(201).json({
        status: true,
        message: 'Folder added successfully',
        folder: {
          id: result.insertId,
          collection_id,
          parent_folder_id,
          user_id,
          name,
          created_at: new Date(),
          updated_at: new Date(),
        }
      });
    });
  } catch (error) {
    console.error("Error in addFolder:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};



const renameCollection = (req, res) => {
  const { collection_id, name } = req.body;

  if (!collection_id || !name) {
    return res.status(400).json({ error: 'Missing collection_id or name' });
  }

  apiModel.renameCollection(collection_id, name, (err, result) => {
    if (err) {
      console.error('Error renaming collection:', err);
      return res.status(500).json({ error: 'Failed to rename collection' });
    }

    res.status(200).json({ message: 'Collection renamed successfully', result });
  });
};



// Delete Collecti
const deleteCollection = async (req, res) => {
  const { collection_id } = req.body;

  if (!collection_id) {
    return res.status(400).json({ error: 'Missing collection_id' });
  }

  try {
    apiModel.deleteCollection(collection_id, (err, result) => {
  if (err) {
    console.error('Error deleting collection:', err);
    return res.status(500).json({ error: 'Failed to delete collection' });
  }
  return res.status(200).json({ message: 'Collection deleted successfully', result });
});

  } catch (err) {
    console.error('Error deleting collection:', err);
    return res.status(500).json({ error: 'Failed to delete collection' });
  }
};


const renameFolder = (req, res) => {
  const { folder_id, name } = req.body;

  if (!folder_id || !name) {
    return res.status(400).json({ error: 'Missing folder_id or name' });
  }

  apiModel.renameFolder(folder_id, name, (err, result) => {
    if (err) {
      console.error('Error renaming folder:', err);
      return res.status(500).json({ error: 'Failed to rename folder' });
    }
    return res.status(200).json({ message: 'Folder renamed successfully', result });
  });
};


// Delete Collecti
const deleteFolder = async (req, res) => {
  const { folder_id } = req.body;

  if (!folder_id) {
    return res.status(400).json({ error: 'Missing folder_id' });
  }

  try {
    apiModel.deleteFolder(folder_id, (err, result) => {
  if (err) {
    console.error('Error deleting folder:', err);
    return res.status(500).json({ error: 'Failed to delete folder' });
  }
  return res.status(200).json({ message: 'Folder deleted successfully', result });
});

  } catch (err) {
    console.error('Error deleting folder:', err);
    return res.status(500).json({ error: 'Failed to delete folder' });
  }
};

const renameRequest = (req, res) => {
  const { request_id, name } = req.body;

  if (!request_id || !name) {
    return res.status(400).json({ error: 'Missing request_id or name' });
  }

  apiModel.renameRequest(request_id, name, (err, result) => {
    if (err) {
      console.error('Error renaming request:', err);
      return res.status(500).json({ error: 'Failed to rename request' });
    }
    return res.status(200).json({status:true, message: 'Request renamed successfully', result });
  });
};


// Delete Collecti
const deleteRequest = async (req, res) => {
  const { request_id } = req.body;

  if (!request_id) {
    return res.status(400).json({ error: 'Missing request_id' });
  }

  try {
    apiModel.deleteRequest(request_id, (err, result) => {
  if (err) {
    console.error('Error deleting folder:', err);
    return res.status(500).json({ error: 'Failed to delete request' });
  }
  return res.status(200).json({status:true, message: 'Request deleted successfully', result });
});

  } catch (err) {
    console.error('Error deleting request:', err);
    return res.status(500).json({ error: 'Failed to delete request' });
  }
};

const getCollections = (req, res) => {
  try{
    const wks_id = req.query.wks_id;

  if (!wks_id) {
    return res.status(400).json({ status: false, message: "Missing Workspace" });
  }

  apiModel.getCollectionsByWorkspace(wks_id, (err, collections) => {
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
  const { collection_id,folder_id, name, method, url, body } = req.body;
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
    body: body || '',
    folder_id:folder_id || null
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

  apiModel.getRequestsByCollectionId(collection_id, (err, data) => {
    if (err) {
      return res.status(500).json({ status: false, message: "Database error" });
    }

    return res.json({
      status: true,
      folders: data.folders,
      requests: data.requests
    });
  });
};

const getRequestsByFolderId = (req, res) => {
  const folder_id = req.query.folder_id;

  if (!folder_id) {
    return res.status(400).json({ status: false, message: "Missing folder_id" });
  }

  apiModel.getRequestsByFolderId(folder_id, (err, data) => {
    if (err) {
      return res.status(500).json({ status: false, message: "Database error" });
    }

    return res.json({
      status: true,
      folders: data.folders,
      requests: data.requests
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

const getWorkspaces = (req, res) => {
  const user_id = req.query.user_id;

  if (!user_id) {
    return res.status(400).json({ status: false, message: "Missing user id" });
  }

  apiModel.getWorkspaces(user_id, (err, data) => {
    if (err) {
      return res.status(500).json({ status: false, message: "Database error" });
    }

    return res.json({
      status: true,
      workspaces: data,
    });
  });
};

const createWorkspace = (req, res) => {
  const { name, user_id, members } = req.body;

  if (!name || !user_id) {
    return res.json({ status: false, message: "Workspace name and user_id required" });
  }

  // Step 1: create workspace
  apiModel.createWorkspace(name, user_id, (err, workspaceId) => {
    if (err) {
      console.error("DB Error:", err);
      return res.json({ status: false, message: "Error creating workspace" });
    }

    // Step 2: add creator as OWNER
    apiModel.addMember(workspaceId, user_id, "OWNER", (err) => {
      if (err) {
        console.error("DB Error:", err);
        return res.json({ status: false, message: "Error adding owner" });
      }

      // Step 3: loop through members
      if (members && members.length > 0) {
        members.forEach((m) => {
          if (!m.email || !m.role) return; // skip empty row

          apiModel.findUserByEmail(m.email, (err, user) => {
            if (err) return console.error("DB Error:", err);
            if (!user) return console.log(`User not found: ${m.email}`);

            apiModel.addMember(workspaceId, user.id, m.role, (err) => {
              if (err) console.error("DB Error:", err);
            });
            return res.json({
        status: true,
        message: "Workspace created successfully",
        workspace: { id: workspaceId, name },
      });
          });
        });
      }

      
    });
  });
};

const searchRequests = (req, res) => {
  const { workspace_id, q } = req.query;

  if (!workspace_id || !q) {
    return res.status(400).json({
      status: false,
      error: "workspace_id and q are required",
    });
  }

  apiModel.searchRequests(workspace_id, q, (err, requests) => {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).json({ status: false, error: "Search failed" });
    }

    res.json({ status: true, results: requests });
  });
};




module.exports = {
  addCollection,
  addFolder,
  renameCollection,
  deleteCollection,
  renameFolder,
  deleteFolder,
  renameRequest,
  deleteRequest,
  getCollections,
  addRequest,
  getRequestsByCollectionId,
  getRequestsByFolderId,
  updateRequest,
  getWorkspaces,
  createWorkspace,
  searchRequests,
};
