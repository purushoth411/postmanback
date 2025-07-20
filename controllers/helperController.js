// controllers/helperController.js
const helperModel = require('../models/helperModel');

const getRemarks = (req, res) => {
    const { task_id } = req.body;

    if (!task_id) {
        return res.status(400).json({ status: false, message: 'task_id is required' });
    }

    helperModel.getRemarks(task_id, (err, remarks) => {
        if (err) {
            console.error('Error fetching remarks:', err);
            return res.status(500).json({ status: false, message: 'Server error' });
        }

        return res.json({
            status: true,
            message: 'Success',
            data: remarks.length > 0 ? remarks : []
        });
    });
};


const getHistory = (req, res) => {
    const { task_id } = req.body;

    if (!task_id) {
        return res.status(400).json({ status: false, message: 'task_id is required' });
    }

    helperModel.getHistory(task_id, (err, history) => {
        if (err) {
            console.error('Error fetching history:', err);
            return res.status(500).json({ status: false, message: 'Server error' });
        }

        return res.json({
            status: true,
            message: 'Success',
            data: history.length > 0 ? history : []
        });
    });
};

const getReminders = (req, res) => {
    const { task_id, user_id } = req.body;

    if (!task_id || !user_id) {
        return res.status(400).json({ status: false, message: 'task_id & user_id is required' });
    }

    helperModel.getReminders(task_id, user_id, (err, reminders) => {
        if (err) {
            console.error('Error fetching reminders:', err);
            return res.status(500).json({ status: false, message: 'Server error' });
        }

        return res.json({
            status: true,
            message: 'Success',
            data: reminders.length > 0 ? reminders : []
        });
    });
};




const updateFollower = (req, res) => {
    const { taskId, followerIds, user_id, sender_name } = req.body;

    if (!taskId || !Array.isArray(followerIds)) {
        return res.status(400).json({ status: false, message: "taskId and followerIds (array) are required" });
    }

    // Convert [218, 325, 208] to "218,325,208"
    const followerString = followerIds.join(",");

    helperModel.updateFollower(taskId, followerString, (err, result) => {
        if (err) {
            console.error("Error updating followers:", err);
            return res.status(500).json({ status: false, message: "Server error while updating followers" });
        }

        const historyMessage = `${sender_name} updated the task followers.`;
        helperModel.addTaskHistory(taskId, historyMessage, user_id, (err2) => {
            if (err2) console.error("Error adding task history:", err2);
        });

        return res.json({
            status: true,
            message: "Followers updated successfully",
        });
    });
};

const updateTags = (req, res) => {
    const { taskId, tagIds, user_id, sender_name } = req.body;

    if (!taskId || !Array.isArray(tagIds)) {
        return res.status(400).json({ status: false, message: "taskId and tags (array) are required" });
    }

    // Convert [218, 325, 208] to "218,325,208"
    const tagString = tagIds.join(",");

    helperModel.updateTags(taskId, tagString, (err, result) => {
        if (err) {
            console.error("Error updating tags:", err);
            return res.status(500).json({ status: false, message: "Server error while updating tags" });
        }

        const historyMessage = `${sender_name} updated the task tags.`;
        helperModel.addTaskHistory(taskId, historyMessage, user_id, (err2) => {
            if (err2) console.error("Error adding task history:", err2);
        });

        return res.json({
            status: true,
            message: "tags updated successfully",
        });
    });
};

const markAsOngoing = (req, res) => {
    const { user_id, task_id, sender_name } = req.body;

    if (!user_id || !task_id) {
        return res.status(400).json({ status: false, message: "user_id and task_id are required" });
    }

    helperModel.markAsOngoing(task_id, user_id, (err, result) => {
        if (err) {
            console.error("Error marking task as ongoing:", err);
            return res.status(500).json({ status: false, message: "Server error while updating task" });
        }

        const historyMessage = `${sender_name} marked the task as Ongoing.`;
        helperModel.addTaskHistory(task_id, historyMessage, user_id, (err2) => {
            if (err2) console.error("Error adding task history:", err2);
        });

        return res.json({
            status: true,
            message: "Task marked as ongoing",
        });
    });
};

const markAsCompleted = (req, res) => {
    const { user_id, task_id, sender_name } = req.body;

    if (!user_id || !task_id) {
        return res.status(400).json({ status: false, message: "user_id and task_id are required" });
    }

    helperModel.markAsCompleted(task_id, user_id, (err, result) => {
        if (err) {
            console.error("Error marking task as Completed:", err);
            return res.status(500).json({ status: false, message: "Server error while updating task" });
        }

        const historyMessage = `${sender_name} marked the task as Completed.`;
        helperModel.addTaskHistory(task_id, historyMessage, user_id, (err2) => {
            if (err2) console.error("Error adding task history:", err2);
        });

        return res.json({
            status: true,
            message: "Task marked as Completed",
        });
    });
};

const transferTask = (req, res) => {
    const { taskId, newUserId, user_id, sender_name } = req.body;

    if (!taskId || !newUserId || !user_id || !sender_name) {
        return res.status(400).json({ status: false, message: "taskId, newUserId, user_id, sender_name are required" });
    }

    helperModel.transferTask(taskId, newUserId, user_id, (err, result) => {
        if (err) {
            console.error("Error transferring task:", err);
            return res.status(500).json({ status: false, message: "Server error while transferring task" });
        }

        const historyMessage = `${sender_name} transferred the Task to User ${newUserId}.`;
        helperModel.addTaskHistory(taskId, historyMessage, user_id, (err2) => {
            if (err2) console.error("Error adding task history:", err2);
        });

        return res.json({
            status: true,
            message: "Task transferred successfully",
        });
    });
};


const getAllTags = (req, res) => {
    helperModel.getAllTags((err, tags) => {
        if (err) {
            return res.status(500).json({ status: false, message: "an error occured" + err })
        }

        return res.json({ status: true, message: "Success", data: tags })
    })
}

const getAllRequirements = (req, res) => {
    helperModel.getAllRequirements((err, tags) => {
        if (err) {
            return res.status(500).json({ status: false, message: "an error occured" + err })
        }

        return res.json({ status: true, message: "Success", data: tags })
    })
}

const getAllCurrency = (req, res) => {
    helperModel.getAllCurrency((err, tags) => {
        if (err) {
            return res.status(500).json({ status: false, message: "an error occured" + err })
        }

        return res.json({ status: true, message: "Success", data: tags })
    })
}

const getAllOtherTags = (req, res) => {
    helperModel.getAllOtherTags((err, tags) => {
        if (err) {
            return res.status(500).json({ status: false, message: "an error occured" + err })
        }

        return res.json({ status: true, message: "Success", data: tags })
    })
}

const getAllBenchmarks = (req, res) => {
    helperModel.getAllBenchmarks((err, benchmarks) => {
        if (err) {
            return res.status(500).json({ status: false, message: "an error occured" + err })
        }

        return res.json({ status: true, message: "Success", data: benchmarks })
    })
}
const getAllProjects = (req, res) => {
    helperModel.getAllProjects((err, benchmarks) => {
        if (err) {
            return res.status(500).json({ status: false, message: "an error occured" + err })
        }

        return res.json({ status: true, message: "Success", data: benchmarks })
    })
}

const getAllBuckets = (req, res) => {
    helperModel.getAllBuckets((err, benchmarks) => {
        if (err) {
            return res.status(500).json({ status: false, message: "an error occured" + err })
        }

        return res.json({ status: true, message: "Success", data: benchmarks })
    })
}

const getTaskMilestones = (req, res) => {
    const { taskId } = req.body;

    if (!taskId) {
        return res.status(400).json({ status: false, message: "taskId is required" });
    }

    helperModel.getTaskDetails(taskId, async (err, taskDetails) => {
        if (err || !taskDetails) {
            return res.status(500).json({ status: false, message: "Error fetching task details" });
        }

        let milestoneNames = (taskDetails.fld_benchmark_name || "").split(",");
        let milestonePercents = (taskDetails.fld_benchmark_percent || "").split(",");
        let milestoneDeadlines = (taskDetails.fld_milestone_deadline || "").split(",");
        let completedBenchmarks = (taskDetails.fld_completed_benchmarks || "").split(",");
        let completedByData = (taskDetails.fld_benchmark_completed_by || "").split(",");

        // Special case for crm_query tasks
        if (taskDetails.task_type === "crm_query" && !completedBenchmarks.includes("28")) {
            const index28 = milestoneNames.indexOf("28");
            if (index28 !== -1) {
                milestoneNames = milestoneNames.slice(0, index28 + 1);
            }
        }

        const milestones = [];
        for (let i = 0; i < milestoneNames.length; i++) {
            const benchmarkId = milestoneNames[i];

            const benchmarkInfo = await helperModel.getBenchmarkInfo(benchmarkId);
            const completedInfo = await helperModel.getBenchmarkCompletedInfo(benchmarkId, taskId);

            let completedByUser = null;
            if (completedInfo && completedInfo.fld_added_by) {
                completedByUser = await helperModel.getAdminNameById(completedInfo.fld_added_by);
            }


            milestones.push({
                benchmark_id: benchmarkId,
                name: benchmarkInfo ? benchmarkInfo.fld_benchmark_name : null,
                percent: milestonePercents[i] + " %",
                deadline: milestoneDeadlines[i] || null,
                completed: completedInfo?.status === "Completed",
                completed_by: completedByUser || null,
            });
        }

        return res.json({ status: true, message: "Success", data: milestones });
    });
};

////
const getAllTeams = (req, res) => {
    helperModel.getAllTeams((err, teams) => {
        if (err) {
            return res.status(500).json({ status: false, message: "An error occurred", error: err });
        }

        return res.json({ status: true, message: "Success", data: teams });
    });
};

const updateTeam = (req, res) => {
    const teamId = req.params.id;
    const { team_name, team_members } = req.body;

    if (!team_name || !team_members) {
        return res.status(400).json({ status: false, message: "team_name and team_members are required" });
    }

    helperModel.updateTeam(teamId, team_name, team_members, (err, result) => {
        if (err) {
            return res.status(500).json({ status: false, message: "An error occurred", error: err });
        }

        return res.json({ status: true, message: "Team updated successfully" });
    });
};

const createTeam = (req, res) => {
    const { team_name, team_members, created_by } = req.body;

    if (!team_name || !team_members || !created_by) {
        return res.status(400).json({ status: false, message: "team_name, team_members, and created_by are required" });
    }

    helperModel.createTeam(team_name, team_members, created_by, (err, result) => {
        if (err) {
            return res.status(500).json({ status: false, message: "An error occurred", error: err });
        }

        return res.json({ status: true, message: "Team created successfully", team_id: result.insertId });
    });
};

const deleteTeam = (req, res) => {
    const teamId = req.params.id;

    if (!teamId) {
        return res.status(400).json({ status: false, message: "Team ID is required" });
    }

    helperModel.deleteTeam(teamId, (err, result) => {
        if (err) {
            return res.status(500).json({ status: false, message: "An error occurred", error: err });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ status: false, message: "Team not found or already deleted" });
        }

        return res.json({ status: true, message: "Team deleted successfully" });
    });
};


/////////tags

// Add tag
const addTag = (req, res) => {
    const { tag_name, created_by } = req.body;

    if (!tag_name || !created_by) {
        return res.status(400).json({ status: false, message: "tag_name and created_by are required" });
    }

    helperModel.addTag(tag_name, created_by, (err, result) => {
        if (err) {
            return res.status(500).json({ status: false, message: "An error occurred", error: err });
        }

        return res.json({ status: true, message: "Tag added successfully", tag_id: result.insertId });
    });
};

// Update tag
const updateTag = (req, res) => {
    const tagId = req.params.id;
    const { tag_name } = req.body;

    if (!tag_name) {
        return res.status(400).json({ status: false, message: "tag_name is required" });
    }

    helperModel.updateTag(tagId, tag_name, (err, result) => {
        if (err) {
            return res.status(500).json({ status: false, message: "An error occurred", error: err });
        }

        return res.json({ status: true, message: "Tag updated successfully" });
    });
};

// Delete tag
const deleteTag = (req, res) => {
    const tagId = req.params.id;

    helperModel.deleteTag(tagId, (err, result) => {
        if (err) {
            return res.status(500).json({ status: false, message: "An error occurred", error: err });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ status: false, message: "Tag not found or already deleted" });
        }

        return res.json({ status: true, message: "Tag deleted successfully" });
    });
};

///////////////

// Add bucket
const addBucket = (req, res) => {
    const bucketData = req.body;

    if (!bucketData.fld_bucket_name || !bucketData.fld_added_by) {
        return res.status(400).json({ status: false, message: "fld_bucket_name and fld_added_by are required" });
    }

    helperModel.addBucket(bucketData, (err, result) => {
        if (err) {
            return res.status(500).json({ status: false, message: "An error occurred", error: err });
        }
        return res.json({ status: true, message: "Bucket added successfully", bucket_id: result.insertId });
    });
};

// Update bucket
const updateBucket = (req, res) => {
    const bucketId = req.params.id;
    const bucketData = req.body;

    helperModel.updateBucket(bucketId, bucketData, (err, result) => {
        if (err) {
            return res.status(500).json({ status: false, message: "An error occurred", error: err });
        }
        return res.json({ status: true, message: "Bucket updated successfully" });
    });
};

// Delete bucket
const deleteBucket = (req, res) => {
    const bucketId = req.params.id;

    helperModel.deleteBucket(bucketId, (err, result) => {
        if (err) {
            return res.status(500).json({ status: false, message: "An error occurred", error: err });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ status: false, message: "Bucket not found or already deleted" });
        }

        return res.json({ status: true, message: "Bucket deleted successfully" });
    });
};
///////////////////benchmark

const addBenchmark = (req, res) => {
    const { benchmark_name, added_by, admin_type = 'SUPERADMIN' } = req.body;

    if (!benchmark_name || !added_by) {
        return res.status(400).json({ status: false, message: "benchmark_name and added_by are required" });
    }

    helperModel.addBenchmark(benchmark_name, added_by, admin_type, (err, result) => {
        if (err) {
            return res.status(500).json({ status: false, message: "An error occurred", error: err });
        }
        return res.json({ status: true, message: "Benchmark added successfully", benchmark_id: result.insertId });
    });
};

// Update benchmark
const updateBenchmark = (req, res) => {
    const benchmarkId = req.params.id;
    const { benchmark_name } = req.body;

    if (!benchmark_name) {
        return res.status(400).json({ status: false, message: "benchmark_name is required" });
    }

    helperModel.updateBenchmark(benchmarkId, benchmark_name, (err, result) => {
        if (err) {
            return res.status(500).json({ status: false, message: "An error occurred", error: err });
        }
        return res.json({ status: true, message: "Benchmark updated successfully" });
    });
};

// Delete benchmark
const deleteBenchmark = (req, res) => {
    const benchmarkId = req.params.id;

    helperModel.deleteBenchmark(benchmarkId, (err, result) => {
        if (err) {
            return res.status(500).json({ status: false, message: "An error occurred", error: err });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ status: false, message: "Benchmark not found or already deleted" });
        }

        return res.json({ status: true, message: "Benchmark deleted successfully" });
    });
};

////////////////project

// Add a new project
const addProject = (req, res) => {
    const { project_name, created_by, require_email = 0, email_id = null } = req.body;

    if (!project_name || !created_by) {
        return res.status(400).json({ status: false, message: "project_name, and created_by are required" });
    }

    helperModel.addProject(project_name, created_by, require_email, email_id, (err, result) => {
        if (err) {
            return res.status(500).json({ status: false, message: "An error occurred", error: err });
        }
        return res.json({ status: true, message: "Project added successfully", project_id: result.insertId });
    });
};

// Update project
const updateProject = (req, res) => {
    const projectId = req.params.id;
    const { project_name, require_email, email_id } = req.body;

    if (!project_name) {
        return res.status(400).json({ status: false, message: "project_name are required" });
    }

    helperModel.updateProject(projectId, project_name, require_email, email_id, (err, result) => {
        if (err) {
            return res.status(500).json({ status: false, message: "An error occurred", error: err });
        }
        return res.json({ status: true, message: "Project updated successfully" });
    });
};

// Delete project
const deleteProject = (req, res) => {
    const projectId = req.params.id;

    helperModel.deleteProject(projectId, (err, result) => {
        if (err) {
            return res.status(500).json({ status: false, message: "An error occurred", error: err });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ status: false, message: "Project not found or already deleted" });
        }

        return res.json({ status: true, message: "Project deleted successfully" });
    });
};


// Add a new requirement
const addRequirement = (req, res) => {
    const { category, name } = req.body;

    if (!category || !name) {
        return res.status(400).json({ status: false, message: "category and name are required" });
    }

    helperModel.addRequirement(category, name, (err, result) => {
        if (err) {
            return res.status(500).json({ status: false, message: "An error occurred", error: err });
        }
        return res.json({ status: true, message: "Requirement added successfully", requirement_id: result.insertId });
    });
};

// Update requirement
const updateRequirement = (req, res) => {
    const requirementId = req.params.id;
    const { category, name } = req.body;

    if (!category || !name) {
        return res.status(400).json({ status: false, message: "category and name are required" });
    }

    helperModel.updateRequirement(requirementId, category, name, (err, result) => {
        if (err) {
            return res.status(500).json({ status: false, message: "An error occurred", error: err });
        }
        return res.json({ status: true, message: "Requirement updated successfully" });
    });
};

// Delete requirement
const deleteRequirement = (req, res) => {
    const requirementId = req.params.id;

    helperModel.deleteRequirement(requirementId, (err, result) => {
        if (err) {
            return res.status(500).json({ status: false, message: "An error occurred", error: err });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ status: false, message: "Requirement not found or already deleted" });
        }

        return res.json({ status: true, message: "Requirement deleted successfully" });
    });
};
////////////////////////

// Add a new currency
const addCurrency = (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ status: false, message: "name is required" });
    }

    helperModel.addCurrency(name, (err, result) => {
        if (err) {
            return res.status(500).json({ status: false, message: "An error occurred", error: err });
        }
        return res.json({ status: true, message: "Currency added successfully", currency_id: result.insertId });
    });
};

// Update currency
const updateCurrency = (req, res) => {
    const currencyId = req.params.id;
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ status: false, message: "name is required" });
    }

    helperModel.updateCurrency(currencyId, name, (err, result) => {
        if (err) {
            return res.status(500).json({ status: false, message: "An error occurred", error: err });
        }
        return res.json({ status: true, message: "Currency updated successfully" });
    });
};

// Delete currency
const deleteCurrency = (req, res) => {
    const currencyId = req.params.id;

    helperModel.deleteCurrency(currencyId, (err, result) => {
        if (err) {
            return res.status(500).json({ status: false, message: "An error occurred", error: err });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ status: false, message: "Currency not found or already deleted" });
        }

        return res.json({ status: true, message: "Currency deleted successfully" });
    });
};

/////////////other tags
// Add Other Tag
const addOtherTag = (req, res) => {
    const { user_id, category, tag_name, tag_type } = req.body;

    if (!user_id || !category || !tag_name || !tag_type) {
        return res.status(400).json({ status: false, message: "user_id, category, tag_name, and tag_type are required" });
    }

    helperModel.addOtherTag(user_id, category, tag_name, tag_type, (err, result) => {
        if (err) {
            return res.status(500).json({ status: false, message: "An error occurred", error: err });
        }

        return res.json({ status: true, message: "Tag added successfully", tag_id: result.insertId });
    });
};

// Update Other Tag
const updateOtherTag = (req, res) => {
    const tagId = req.params.id;
    const { category, tag_name, tag_type } = req.body;

    if (!category || !tag_name || !tag_type) {
        return res.status(400).json({ status: false, message: "category, tag_name, and tag_type are required" });
    }

    helperModel.updateOtherTag(tagId, category, tag_name, tag_type, (err, result) => {
        if (err) {
            return res.status(500).json({ status: false, message: "An error occurred", error: err });
        }

        return res.json({ status: true, message: "Tag updated successfully" });
    });
};

// Delete Other Tag
const deleteOtherTag = (req, res) => {
    const tagId = req.params.id;

    helperModel.deleteOtherTag(tagId, (err, result) => {
        if (err) {
            return res.status(500).json({ status: false, message: "An error occurred", error: err });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ status: false, message: "Tag not found or already deleted" });
        }

        return res.json({ status: true, message: "Tag deleted successfully" });
    });
};

module.exports = {
    getRemarks, getHistory, getReminders,
    markAsOngoing, getTaskMilestones,
    transferTask,
    markAsCompleted,
    getAllBenchmarks,
    getAllProjects,
    getAllBuckets,
    getAllTeams,
    updateTeam,
    createTeam,
    deleteTeam,
    updateFollower,
    getAllTags,getAllRequirements,
    getAllOtherTags,
    getAllCurrency,
    updateTags,

    addTag,
    updateTag,
    deleteTag,


    addBucket,
    updateBucket,
    deleteBucket,

    addBenchmark,
    updateBenchmark,
    deleteBenchmark,

    addProject,
    updateProject,
    deleteProject,

    addRequirement,
    updateRequirement,
    deleteRequirement,

    addCurrency,
    updateCurrency,
    deleteCurrency,

     addOtherTag,
    updateOtherTag,
    deleteOtherTag,

};
