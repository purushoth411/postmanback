const { get } = require('http');
const apiModel = require('../models/apiModel');
const { getIO } = require('../socket');

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

        const io = getIO();
       io.emit('collectionAdded', {
          workspaceId: wks_id,   // Include workspace ID
          collection: collection // The newly created collection object
        });
   

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
    const { user_id, name, collection_id, parent_folder_id = null, workspace_id } = req.body;

    if (!user_id || !name || !collection_id) {
      return res.status(400).json({ status: false, message: 'Missing required fields' });
    }

    apiModel.addFolder(user_id, collection_id, parent_folder_id, name, (err, result) => {
      if (err) {
        console.error('Error creating folder:', err);
        return res.status(500).json({ status: false, message: 'Database error' });
      }

      const folder = {
        id: result.insertId,
        collection_id,
        parent_folder_id,
        user_id,
        name,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const io = getIO();
      io.emit('folderAdded', {
        workspaceId: workspace_id, // add this field
        folder,                    // wrap data
      });

      return res.status(201).json({
        status: true,
        message: 'Folder added successfully',
        folder,
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

    // Get collection to find workspace_id
    apiModel.getCollectionById(collection_id, (err, collection) => {
      if (!err && collection) {
        const io = getIO();
        io.emit('collectionRenamed', {
          workspaceId: collection.workspace_id,
          collectionId: collection_id,
          name: name
        });
      }
    });

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
    // Get collection to find workspace_id before deletion
    apiModel.getCollectionById(collection_id, (err, collection) => {
      if (err) {
        console.error('Error fetching collection:', err);
      }

      const workspaceId = collection?.workspace_id;

      apiModel.deleteCollection(collection_id, (err, result) => {
        if (err) {
          console.error('Error deleting collection:', err);
          return res.status(500).json({ error: 'Failed to delete collection' });
        }

        // Emit socket event
        if (workspaceId) {
          const io = getIO();
          io.emit('collectionDeleted', {
            workspaceId: workspaceId,
            collectionId: collection_id
          });
        }

        return res.status(200).json({ message: 'Collection deleted successfully', result });
      });
    });
  } catch (err) {
    console.error('Error deleting collection:', err);
    return res.status(500).json({ error: 'Failed to delete collection' });
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

    // Get request to find workspace_id
    apiModel.getRequestsById(request_id, (err, request) => {
      if (!err && request) {
        apiModel.getCollectionById(request.collection_id, (err, collection) => {
          if (!err && collection) {
            const io = getIO();
            io.emit('requestRenamed', {
              workspaceId: collection.workspace_id,
              requestId: request_id,
              name: name,
              collectionId: request.collection_id
            });
          }
        });
      }
    });

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
    // Get request to find workspace_id before deletion
    apiModel.getRequestsById(request_id, (err, request) => {
      if (err) {
        console.error('Error fetching request:', err);
      }

      const collectionId = request?.collection_id;
      let workspaceId = null;

      if (collectionId) {
        apiModel.getCollectionById(collectionId, (err, collection) => {
          if (!err && collection) {
            workspaceId = collection.workspace_id;
          }

          apiModel.deleteRequest(request_id, (err, result) => {
            if (err) {
              console.error('Error deleting request:', err);
              return res.status(500).json({ error: 'Failed to delete request' });
            }

            // Emit socket event
            if (workspaceId) {
              const io = getIO();
              io.emit('requestDeleted', {
                workspaceId: workspaceId,
                requestId: request_id,
                collectionId: collectionId,
                folderId: request?.folder_id
              });
            }

            return res.status(200).json({status:true, message: 'Request deleted successfully', result });
          });
        });
      } else {
        apiModel.deleteRequest(request_id, (err, result) => {
          if (err) {
            console.error('Error deleting request:', err);
            return res.status(500).json({ error: 'Failed to delete request' });
          }
          return res.status(200).json({status:true, message: 'Request deleted successfully', result });
        });
      }
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
  const { collection_id, folder_id, name, method, url, body } = req.body;
  const user_id = req.session?.user?.id || req.body.user_id;

  if (!user_id || !collection_id || !name || !method) {
    return res
      .status(400)
      .json({ status: false, message: "Missing required fields" });
  }

  const requestData = {
    collection_id,
    user_id,
    name,
    method,
    url: url || "",
    body: body || "",
    folder_id: folder_id || null,
  };

  apiModel.addRequest(requestData, (err, insertId) => {
    if (err) {
      console.error("DB Insert Error:", err);
      return res
        .status(500)
        .json({ status: false, message: "Database insert error" });
    }

    apiModel.getRequestById(insertId, (fetchErr, request) => {
      if (fetchErr || !request) {
        console.error("DB Fetch Error:", fetchErr);
        return res
          .status(500)
          .json({ status: false, message: "Failed to retrieve newly inserted request" });
      }

     
      const io =getIO();
      io.emit("requestAdded", {
        request,
        folderId: folder_id,
        collectionId: collection_id,
        userId: user_id,
      });

      res.json({
        status: true,
        message: "Request added successfully",
        request,
      });
    });
  });
};

// ====================== RENAME FOLDER ======================
const renameFolder = (req, res) => {
  const { folder_id, name } = req.body;

  if (!folder_id || !name) {
    return res.status(400).json({ error: "Missing folder_id or name" });
  }

  apiModel.renameFolder(folder_id, name, (err, result) => {
    if (err) {
      console.error("Error renaming folder:", err);
      return res.status(500).json({ error: "Failed to rename folder" });
    }

    
    const io =getIO();
    io.emit("folderRenamed", { folderId: folder_id, name });

    return res
      .status(200)
      .json({ message: "Folder renamed successfully", result });
  });
};

// ====================== DELETE FOLDER ======================
const deleteFolder = async (req, res) => {
  const { folder_id } = req.body;

  if (!folder_id) {
    return res.status(400).json({ error: "Missing folder_id" });
  }

  try {
    apiModel.deleteFolder(folder_id, (err, result) => {
      if (err) {
        console.error("Error deleting folder:", err);
        return res.status(500).json({ error: "Failed to delete folder" });
      }

      
      const io =getIO();
      io.emit("folderDeleted", { folderId: folder_id });

      return res
        .status(200)
        .json({ message: "Folder deleted successfully", result });
    });
  } catch (err) {
    console.error("Error deleting folder:", err);
    return res.status(500).json({ error: "Failed to delete folder" });
  }
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


const getRequestsByRequestId = (req, res) => {
  const request_id = req.query.request_id;

  const user_id = req.query.user_id;

  if (!request_id || !user_id) {
    return res.status(400).json({ status: false, message: "Missing request_id or user_id" });
  }

  apiModel.getRequestsByRequestId(request_id, user_id, (err, data) => {
    if (err) {
      return res.status(500).json({ status: false, message: "Database error" });
    }

    if (!data) {
      return res.status(404).json({ status: false, message: "Request not found" });
    }

    return res.json({
      status: true,
      request: data
    });
  });
};



// const updateRequest = (req, res) => {
//   const id = req.params.id;
//   const changes = req.body;

//   if (!id) {
//     return res.status(400).json({ status: false, message: "Missing request id" });
//   }

//   if (!changes || Object.keys(changes).length === 0) {
//     return res.status(400).json({ status: false, message: "No update data provided" });
//   }

//   apiModel.updateRequest( id, changes, (err, results) => {
//     if (err) {
//       console.error("Model error:", err);
//       return res.status(500).json({ status: false, message: "Database update failed" });
//     }

//     return res.json({ status: true, message: "Request updated", results });
//   });
// };

// controller
const updateRequest = (req, res) => {
  const request_id = req.query.request_id;
  const user_id = req.query.user_id;
  const changes = req.body;

  if (!request_id || !user_id) {
    return res.status(400).json({ status: false, message: "Missing request_id or user_id" });
  }

  if (!changes || Object.keys(changes).length === 0) {
    return res.status(400).json({ status: false, message: "No update data provided" });
  }

  // Step 1: Get original request name from main table
  apiModel.getRequestsById(request_id, (err, requestData) => {
    if (err) {
      console.error("Error fetching request:", err);
      return res.status(500).json({ status: false, message: "Failed to fetch request" });
    }

    if (!requestData) {
      return res.status(404).json({ status: false, message: "Request not found" });
    }

    const request_name = requestData.name; // original name from main table

    // Step 2: Update draft
    apiModel.updateRequest(request_id, user_id, { ...changes, name: request_name }, (err2, results) => {
      if (err2) {
        console.error("Draft update error:", err2);
        return res.status(500).json({ status: false, message: "Draft update failed" });
      }

      // Get collection to find workspace_id
      if (requestData.collection_id) {
        apiModel.getCollectionById(requestData.collection_id, (err, collection) => {
          if (!err && collection) {
            const io = getIO();
            io.emit('requestUpdated', {
              workspaceId: collection.workspace_id,
              requestId: request_id,
              collectionId: requestData.collection_id,
              folderId: requestData.folder_id,
              changes: changes
            });
          }
        });
      }

      return res.json({ status: true, message: "Draft updated", results });
    });
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
          });
        });
      }

      // Emit socket event
      const io = getIO();
      io.emit('workspaceCreated', {
        userId: user_id,
        workspace: { id: workspaceId, name }
      });

      return res.json({
        status: true,
        message: "Workspace created successfully",
        workspace: { id: workspaceId, name },
      });
    });
  });
};

const getWorkspaceDetails = (req, res) => {
  const { workspace_id, user_id } = req.query;

  if (!workspace_id || !user_id) {
    return res.json({ status: false, message: "workspace_id and user_id required" });
  }

  apiModel.getWorkspaceById(workspace_id, (err, workspace) => {
    if (err) {
      console.error("DB Error:", err);
      return res.json({ status: false, message: "Error fetching workspace" });
    }

    if (!workspace) {
      return res.json({ status: false, message: "Workspace not found" });
    }

    // Get workspace members with user details
    apiModel.getWorkspaceMembers(workspace_id, (err, members) => {
      if (err) {
        console.error("DB Error:", err);
        return res.json({ status: false, message: "Error fetching members" });
      }

      return res.json({
        status: true,
        workspace: {
          ...workspace,
          members: members || []
        }
      });
    });
  });
};

const updateWorkspace = (req, res) => {
  const { workspace_id, name, user_id, existingMembers, newMembers, removedMembers } = req.body;

  if (!workspace_id || !name || !user_id) {
    return res.json({ status: false, message: "workspace_id, name and user_id required" });
  }

  // Check if user is owner
  apiModel.checkUserRole(workspace_id, user_id, (err, role) => {
    if (err) {
      console.error("DB Error:", err);
      return res.json({ status: false, message: "Error checking permissions" });
    }

    if (role !== "OWNER") {
      return res.json({ status: false, message: "Only workspace owners can update workspace" });
    }

    // Check if it's default workspace
    apiModel.isDefaultWorkspace(workspace_id, (err, isDefault) => {
      if (err) {
        console.error("DB Error:", err);
        return res.json({ status: false, message: "Error checking workspace" });
      }

      // Step 1: Update workspace name
      apiModel.updateWorkspaceName(workspace_id, name, (err) => {
        if (err) {
          console.error("DB Error:", err);
          return res.json({ status: false, message: "Error updating workspace name" });
        }

        // Step 2: Update existing members roles
        if (existingMembers && existingMembers.length > 0) {
          existingMembers.forEach((m) => {
            if (m.role !== m.originalRole) {
              apiModel.updateMemberRole(workspace_id, m.user_id, m.role, (err) => {
                if (err) console.error("Error updating member role:", err);
              });
            }
          });
        }

        // Step 3: Remove members
        if (removedMembers && removedMembers.length > 0) {
          removedMembers.forEach((userId) => {
            apiModel.removeMember(workspace_id, userId, (err) => {
              if (err) console.error("Error removing member:", err);
            });
          });
        }

        // Step 4: Add new members
        if (newMembers && newMembers.length > 0) {
          newMembers.forEach((m) => {
            if (!m.email || !m.role) return;

            apiModel.findUserByEmail(m.email, (err, user) => {
              if (err) return console.error("DB Error:", err);
              if (!user) return console.log(`User not found: ${m.email}`);

              // Check if user is already a member
              apiModel.isMember(workspace_id, user.id, (err, exists) => {
                if (err) return console.error("DB Error:", err);
                if (exists) return console.log(`User already a member: ${m.email}`);

                apiModel.addMember(workspace_id, user.id, m.role, (err) => {
                  if (err) console.error("Error adding member:", err);
                });
              });
            });
          });
        }

        // Step 5: Get updated workspace details
        setTimeout(() => {
          apiModel.getWorkspaceById(workspace_id, (err, workspace) => {
            if (err) {
              return res.json({ status: false, message: "Error fetching updated workspace" });
            }

            apiModel.getWorkspaceMembers(workspace_id, (err, members) => {
              if (err) {
                return res.json({ status: false, message: "Error fetching members" });
              }

              // Emit socket event
              const io = getIO();
              io.emit('workspaceUpdated', {
                workspaceId: workspace_id,
                workspace: {
                  ...workspace,
                  members: members || []
                }
              });

              return res.json({
                status: true,
                message: "Workspace updated successfully",
                workspace: {
                  ...workspace,
                  members: members || []
                }
              });
            });
          });
        }, 500); // Small delay to ensure all async operations complete
      });
    });
  });
};

const deleteWorkspace = (req, res) => {
  const { workspace_id, user_id } = req.body;

  if (!workspace_id || !user_id) {
    return res.json({ status: false, message: "workspace_id and user_id required" });
  }

  // Check if user is owner
  apiModel.checkUserRole(workspace_id, user_id, (err, role) => {
    if (err) {
      console.error("DB Error:", err);
      return res.json({ status: false, message: "Error checking permissions" });
    }

    if (role !== "OWNER") {
      return res.json({ status: false, message: "Only workspace owners can delete workspace" });
    }

    // Check if it's default workspace
    apiModel.isDefaultWorkspace(workspace_id, (err, isDefault) => {
      if (err) {
        console.error("DB Error:", err);
        return res.json({ status: false, message: "Error checking workspace" });
      }

      if (isDefault) {
        return res.json({ status: false, message: "Cannot delete default workspace" });
      }

      // Delete workspace (will cascade delete members, collections, etc.)
      apiModel.deleteWorkspace(workspace_id, (err) => {
        if (err) {
          console.error("DB Error:", err);
          return res.json({ status: false, message: "Error deleting workspace" });
        }

        // Emit socket event
        const io = getIO();
        io.emit('workspaceDeleted', {
          workspaceId: workspace_id,
          userId: user_id
        });

        return res.json({
          status: true,
          message: "Workspace deleted successfully"
        });
      });
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

const saveRequest = (req, res) => {
  const { request_id, user_id, request_data } = req.body;

  if (!request_id || !user_id || !request_data) {
    return res.status(400).json({ status: false, message: "Missing required fields" });
  }

  apiModel.saveRequest(request_id, user_id, request_data, (err, result) => {
    if (err) {
      console.error("Save error:", err);
      return res.status(500).json({ status: false, message: "Database error" });
    }

    // Get request to find workspace_id
    apiModel.getRequestsById(request_id, (err, request) => {
      if (!err && request && request.collection_id) {
        apiModel.getCollectionById(request.collection_id, (err, collection) => {
          if (!err && collection) {
            const io = getIO();
            io.emit('requestSaved', {
              workspaceId: collection.workspace_id,
              requestId: request_id,
              collectionId: request.collection_id,
              folderId: request.folder_id
            });
          }
        });
      }
    });

    return res.json({
      status: true,
      message: "Request saved for all users",
      data: result
    });
  });
};

// Get all environments for a workspace
const getEnvironments = (req, res) => {
  const { wks_id, user_id } = req.query;

  if (!wks_id || !user_id) {
    return res.status(400).json({ status: false, message: "Missing workspace_id or user_id" });
  }

  apiModel.getEnvironments(wks_id, user_id, (err, data) => {
    if (err) {
      return res.status(500).json({ status: false, message: "Database error" });
    }

    return res.json(data);
  });
};

// Get active environment for user in workspace
const getActiveEnvironment = (req, res) => {
  const { user_id, workspace_id } = req.query;

  if (!user_id || !workspace_id) {
    return res.status(400).json({ status: false, message: "Missing user_id or workspace_id" });
  }

  apiModel.getActiveEnvironment(user_id, workspace_id, (err, data) => {
    if (err) {
      return res.status(500).json({ status: false, message: "Database error" });
    }

    return res.json(data);
  });
};

// Add new environment
const addEnvironment = (req, res) => {
  const { user_id, workspace_id, name } = req.body;

  if (!user_id || !workspace_id || !name) {
    return res.status(400).json({ status: false, message: "Missing required fields" });
  }

  apiModel.addEnvironment(user_id, workspace_id, name, (err, data) => {
    if (err) {
      return res.status(500).json({ status: false, message: "Database error" });
    }

    // Emit socket event
    const io = getIO();
    io.emit('environmentAdded', {
      workspaceId: workspace_id,
      environment: data
    });

    return res.json(data);
  });
};

// Set active environment
const setActiveEnvironment = (req, res) => {
  const { user_id, workspace_id, environment_id } = req.body;

  if (!user_id || !workspace_id) {
    return res.status(400).json({ status: false, message: "Missing user_id or workspace_id" });
  }

  apiModel.setActiveEnvironment(user_id, workspace_id, environment_id, (err, data) => {
    if (err) {
      return res.status(500).json({ status: false, message: "Database error" });
    }

    // Emit socket event
    const io = getIO();
    io.emit('environmentActivated', {
      workspaceId: workspace_id,
      userId: user_id,
      environmentId: environment_id
    });

    return res.json(data);
  });
};

// Update environment name
const updateEnvironment = (req, res) => {
  const { environment_id, name } = req.body;

  if (!environment_id || !name) {
    return res.status(400).json({ status: false, message: "Missing environment_id or name" });
  }

  // Get environment to find workspace_id before update
  apiModel.getEnvironments(null, null, (err, environments) => {
    const env = environments?.find(e => e.id === parseInt(environment_id));
    const workspaceId = env?.workspace_id;

    apiModel.updateEnvironment(environment_id, name, (err, data) => {
      if (err) {
        return res.status(500).json({ status: false, message: "Database error" });
      }

      // Emit socket event
      if (workspaceId) {
        const io = getIO();
        io.emit('environmentUpdated', {
          workspaceId: workspaceId,
          environmentId: environment_id,
          name: name
        });
      }

      return res.json(data);
    });
  });
};

// Delete environment
const deleteEnvironment = (req, res) => {
  const { environment_id } = req.body;

  if (!environment_id) {
    return res.status(400).json({ status: false, message: "Missing environment_id" });
  }

  // Get environment to find workspace_id before deletion
  apiModel.getEnvironments(null, null, (err, environments) => {
    const env = environments?.find(e => e.id === parseInt(environment_id));
    const workspaceId = env?.workspace_id;

    apiModel.deleteEnvironment(environment_id, (err, data) => {
      if (err) {
        return res.status(500).json({ status: false, message: "Database error" });
      }

      // Emit socket event
      if (workspaceId) {
        const io = getIO();
        io.emit('environmentDeleted', {
          workspaceId: workspaceId,
          environmentId: environment_id
        });
      }

      return res.json(data);
    });
  });
};

// Get environment variables
const getEnvironmentVariables = (req, res) => {
  const { environment_id } = req.query;

  if (!environment_id) {
    return res.status(400).json({ status: false, message: "Missing environment_id" });
  }

  apiModel.getEnvironmentVariables(environment_id, (err, data) => {
    if (err) {
      return res.status(500).json({ status: false, message: "Database error" });
    }

    return res.json(data);
  });
};

// Add environment variable
const addEnvironmentVariable = (req, res) => {
  const { environment_id, key, value, type } = req.body;

  if (!environment_id || !key) {
    return res.status(400).json({ status: false, message: "Missing environment_id or key" });
  }

  apiModel.addEnvironmentVariable(environment_id, key, value, type, (err, data) => {
    if (err) {
      return res.status(500).json({ status: false, message: "Database error" });
    }

    // Get environment to find workspace_id
    apiModel.getEnvironments(null, null, (err, environments) => {
      const env = environments?.find(e => e.id === parseInt(environment_id));
      if (env && env.workspace_id) {
        const io = getIO();
        io.emit('environmentVariableAdded', {
          workspaceId: env.workspace_id,
          environmentId: environment_id,
          variable: data
        });
      }
    });

    return res.json(data);
  });
};

// Update environment variable
const updateEnvironmentVariable = (req, res) => {
  const { id, key, value, type } = req.body;

  if (!id || !key) {
    return res.status(400).json({ status: false, message: "Missing id or key" });
  }

  apiModel.updateEnvironmentVariable(id, key, value, type, (err, data) => {
    if (err) {
      return res.status(500).json({ status: false, message: "Database error" });
    }

    // Get variable to find environment_id and workspace_id
    apiModel.getEnvironmentVariables(data?.environment_id || null, (err, vars) => {
      const variable = vars?.find(v => v.id === parseInt(id));
      if (variable && variable.environment_id) {
        apiModel.getEnvironments(null, null, (err, environments) => {
          const env = environments?.find(e => e.id === variable.environment_id);
          if (env && env.workspace_id) {
            const io = getIO();
            io.emit('environmentVariableUpdated', {
              workspaceId: env.workspace_id,
              environmentId: variable.environment_id,
              variableId: id,
              variable: data
            });
          }
        });
      }
    });

    return res.json(data);
  });
};

// Delete environment variable
const deleteEnvironmentVariable = (req, res) => {
  const { id, environment_id } = req.body;

  if (!id) {
    return res.status(400).json({ status: false, message: "Missing id" });
  }

  // Get variable to find environment_id before deletion if not provided
  const getEnvId = (callback) => {
    if (environment_id) {
      return callback(null, environment_id);
    }
    // Try to get from all environments
    apiModel.getEnvironments(null, null, (err, environments) => {
      if (err || !environments) return callback(err, null);
      // Get variable from first environment that has it
      let foundEnvId = null;
      const checkEnv = (idx) => {
        if (idx >= environments.length) return callback(null, foundEnvId);
        apiModel.getEnvironmentVariables(environments[idx].id, (err, vars) => {
          if (!err && vars && vars.find(v => v.id === parseInt(id))) {
            foundEnvId = environments[idx].id;
            return callback(null, foundEnvId);
          }
          checkEnv(idx + 1);
        });
      };
      checkEnv(0);
    });
  };

  getEnvId((err, envId) => {
    apiModel.deleteEnvironmentVariable(id, (err, data) => {
      if (err) {
        return res.status(500).json({ status: false, message: "Database error" });
      }

      // Get workspace_id from environment
      if (envId) {
        apiModel.getEnvironments(null, null, (err, environments) => {
          const env = environments?.find(e => e.id === envId);
          if (env && env.workspace_id) {
            const io = getIO();
            io.emit('environmentVariableDeleted', {
              workspaceId: env.workspace_id,
              environmentId: envId,
              variableId: id
            });
          }
        });
      }

      return res.json(data);
    });
  });
};

// Get global variables
const getGlobalVariables = (req, res) => {
  const { workspace_id } = req.query;

  if (!workspace_id) {
    return res.status(400).json({ status: false, message: "Missing workspace_id" });
  }

  apiModel.getGlobalVariables(workspace_id, (err, data) => {
    if (err) {
      return res.status(500).json({ status: false, message: "Database error" });
    }

    return res.json(data);
  });
};

// Add global variable
const addGlobalVariable = (req, res) => {
  const { workspace_id, key, value, type } = req.body;

  if (!workspace_id || !key) {
    return res.status(400).json({ status: false, message: "Missing workspace_id or key" });
  }

  apiModel.addGlobalVariable(workspace_id, key, value, type, (err, data) => {
    if (err) {
      return res.status(500).json({ status: false, message: "Database error" });
    }

    // Emit socket event
    const io = getIO();
    io.emit('globalVariableAdded', {
      workspaceId: workspace_id,
      variable: data
    });

    return res.json(data);
  });
};

// Update global variable
const updateGlobalVariable = (req, res) => {
  const { id, key, value, type } = req.body;

  if (!id || !key) {
    return res.status(400).json({ status: false, message: "Missing id or key" });
  }

  apiModel.updateGlobalVariable(id, key, value, type, (err, data) => {
    if (err) {
      return res.status(500).json({ status: false, message: "Database error" });
    }

    // Get variable to find workspace_id
    apiModel.getGlobalVariables(data?.workspace_id || null, (err, vars) => {
      const variable = vars?.find(v => v.id === parseInt(id));
      const workspaceId = variable?.workspace_id || data?.workspace_id;
      
      if (workspaceId) {
        const io = getIO();
        io.emit('globalVariableUpdated', {
          workspaceId: workspaceId,
          variableId: id,
          variable: data
        });
      }
    });

    return res.json(data);
  });
};

// Delete global variable
const deleteGlobalVariable = (req, res) => {
  const { id, workspace_id } = req.body;

  if (!id) {
    return res.status(400).json({ status: false, message: "Missing id" });
  }

  // Get variable to find workspace_id before deletion if not provided
  const getWorkspaceId = (callback) => {
    if (workspace_id) {
      return callback(null, workspace_id);
    }
    // Try to get from all workspaces (this is inefficient but works)
    // Better approach: require workspace_id in request body
    return callback(null, null);
  };

  getWorkspaceId((err, wsId) => {
    apiModel.deleteGlobalVariable(id, (err, data) => {
      if (err) {
        return res.status(500).json({ status: false, message: "Database error" });
      }

      // Emit socket event
      if (wsId) {
        const io = getIO();
        io.emit('globalVariableDeleted', {
          workspaceId: wsId,
          variableId: id
        });
      }

      return res.json(data);
    });
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
  getRequestsByRequestId,
  updateRequest,
  getWorkspaces,
  createWorkspace,
  getWorkspaceDetails,
  updateWorkspace,
  deleteWorkspace,
  searchRequests,
  saveRequest,
  getEnvironments,
  getActiveEnvironment,
  addEnvironment,
  setActiveEnvironment,
  updateEnvironment,
  deleteEnvironment,
  getEnvironmentVariables,
  addEnvironmentVariable,
  updateEnvironmentVariable,
  deleteEnvironmentVariable,
  getGlobalVariables,
  addGlobalVariable,
  updateGlobalVariable,
  deleteGlobalVariable,
};
