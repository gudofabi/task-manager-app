const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')
const router = express.Router()

// TASKS
router.post('/tasks', auth, async (req, res) => {
    // const task = new Task(req.body);
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })

    try {
        await task.save()
        res.status(201).send(task)
    } catch (error) {
        res.status(400).send()
    }
})

// GET: /tasks?completed=true
// GET: /tasks?limit=10&skip=0
// GET: /tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {
    const match = {}
    const sort = {}

    if(req.query.completed) {
        match.completed = req.query.completed === 'true'
    }

    if(req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1 
    }
    
    // console.log(sort)
    // This is the value of the code above { createdAt: 1 }

    try {
        // const tasks = await Task.find({ owner: req.user._id })
        // res.send(tasks)

        // # using populate
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.tasks)
    } catch (error) {
        res.status(500).send(error)
    }
});

router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;
    try {
        const task = await Task.findOne({_id, owner: req.user._id})
        !task ? res.status(404).send() : res.send(task)
    } catch (error) {
        res.status(500).send()
    }
});

router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedToUpdate = ['description', 'completed']
    const isValid = updates.every(update => allowedToUpdate.includes(update))
    if(!isValid) {
        return res.status(400).send({error: 'Invalid updates!'})
    } 
    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id })
        
        if(!task) {
            return res.status(404).send()
        }

        updates.forEach(update => task[update] = req.body[update])
        await task.save()
        res.send(task)

    } catch (error) {
        res.status(400).send()
    }
})

router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id})
        !task ? res.status(404).send() : res.send(task)
    } catch (error) {
        res.status(500).send()
    }
})

module.exports = router