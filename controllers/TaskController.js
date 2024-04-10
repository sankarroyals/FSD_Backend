
const Project = require("../models/Projects")
const Tasks = require("../models/Tasks")
const UserStories = require("../models/UserStories")
const send_mail = require("../helpers/EmailSending");


exports.getAllTasks = async (req, res, next) => {
    try {
        const tasks = await Tasks.find({}).populate({ path: 'lastUpdatedBy', select: ["userName", "_id", 'email', 'image'] }).populate({ path: 'owner', select: ["userName", "_id", 'email', 'image'] })
        return res.status(200).send(tasks)

    } catch (err) {
        return res.status(400).send(err)

    }
}

exports.getSingleTask = async (req, res, next) => {
    try {
        const tasks = await Tasks.findOne({ _id: req.body.taskId }).populate({ path: 'lastUpdatedBy', select: ["userName", "_id", 'email', 'image'] }).populate({ path: 'owner', select: ["userName", "_id", 'email', 'image'] })
        return res.status(200).send(tasks)

    } catch (err) {
        return res.status(400).send(err)

    }
}


exports.addTask = async (req, res, next) => {
    try {
        const { projectId, userStoryId, name, description, user_id, owner, due } = req.body
        const tasksExists = await Tasks.findOne({ userStoryId: userStoryId, name: name })
        if (tasksExists) {
            return res.status(400).json({ message: 'Tasks Name already exists' })
        }
        const addedTask = await Tasks.create({ projectId: projectId, userStoryId: userStoryId, name: name, description, owner, createdBy: user_id, status: 'New', due, lastUpdatedBy: user_id })
        const userStory = await UserStories.findOne({ _id: userStoryId })
        userStory.taskIds.unshift(addedTask._id.toString())
        userStory.save()
        const fetchingNewTask = await Tasks.findOne({ _id: addedTask._id }).populate({ path: 'lastUpdatedBy', select: ["userName", "_id", 'email', 'image'] }).populate({ path: 'owner', select: ["userName", "_id", 'email', 'image'] })
        const projectDetails = await Project.findOne({ _id: projectId })
        const userStorydetails = await UserStories.findOne({ _id: userStoryId })

        await send_mail(fetchingNewTask.owner.email, 'Assigned a Task for you!', `Hi ${fetchingNewTask.owner.userName}, a Task <b>${fetchingNewTask.name}</b> has been assigned to you from project <b>${projectDetails.name}</b> and userStory <b>${userStorydetails.name}</b>`)
        return res.status(200).json(fetchingNewTask)
    } catch (err) {
        return res.status(400).send(err)

    }
}


exports.updateTask = async (req, res, next) => {
    try {
        const { taskId, owner, due, name, description, status, updatedBy } = req.body
        const taskExist = await Tasks.findOne({ _id: taskId })
        if (!taskExist) {
            return res.status(400).json({ message: 'Task not exists' })
        }
        await Tasks.updateOne({ _id: taskId }, { $set: { owner: owner, name: name, description: description, status: status, lastUpdatedBy: updatedBy, due: due } })
        const updatedTask = await Tasks.findOne({ _id: taskId }).populate({ path: 'owner', select: ["userName", "_id", 'email', 'image'] })
        const projectDetails = await Project.findOne({ _id: updatedTask.projectId })
        const userStorydetails = await UserStories.findOne({ _id: updatedTask.userStoryId })
        await send_mail(updatedTask.owner.email, 'Updates on your task!', `Hi ${updatedTask.owner.userName}, a Task <b>${updatedTask.name}</b> has been updated in project <b>${projectDetails.name}</b> and userStory <b>${userStorydetails.name}</b>`)

        return res.status(200).send('userstory updated')
    } catch (err) {
        return res.status(400).send(err)

    }
}

exports.deleteTask = async (req, res, next) => {
    try {
        const { taskId } = req.body
        await Tasks.deleteOne({ _id: taskId })
        return res.status(200).send('Task deleted')
    } catch (err) {
        return res.status(400).send(err)

    }
}