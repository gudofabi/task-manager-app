const express = require('express')
const multer = require('multer')
const auth = require('../middleware/auth')
const User = require('../models/user')
const router = express.Router()


// CREATE USER
router.post('/users', async (req, res) => {
    const user = new User(req.body);
    try {
        await user.save()
        const token = await user.generateAuthToken()
        res.status(201).send({user, token})
    } catch (error) {
        res.status(400).send(error)
    }
})

// LOGIN
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({user, token})
    } catch (error) {
        res.status(400).send()
    }
});

// LOGOUT USER
router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()
        res.send()
    } catch (error) {
        res.status(500).send()
    }
})

// LOGOUT ALL
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (error) {
        res.status(500).send()
    }
})

// GET AUTHENTICATED USER
router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
});

//  GET ALL USERS
router.get('/users', auth, async (req, res) => {
    try {
        const users = await User.find({})
        res.send(users);
    } catch (error) {
        res.status(500).send();
    }
});

// UPDATE
router.patch('/users/me', auth, async (req, res) => {
    // #INFO: "req.user" -- is came from the middleware/auth.js
    const updates = Object.keys(req.body)
    const allowedToUpdate = ['name', 'age', 'email', 'password']
    const isValid = updates.every(update => allowedToUpdate.includes(update))
    if(!isValid) {
        return res.status(400).send({error: 'Invalid updates!'})
    } 
    try {
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        res.send(req.user)
    } catch (error) {
        res.status(400).send()
    }
})

// DELETE
router.delete('/users/me', auth, async (req, res) => {
    // #INFO: "req.user" -- is came from the middleware/auth.js
    try {
        await req.user.remove()
        res.send(req.user)
    } catch (error) {
        res.status(500).send()
    }
})

// UPLOAD
const upload = multer({
    dest: 'avatars',
    limits: {
        fileSize: 1000000 // 1MB
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            return cb(new Error('Please upload an image'))
        }

        cb(undefined, true)
    }
})

router.post('/users/me/avatar', upload.single('avatar'), (req, res) => {
    res.send()
})

module.exports = router