const express = require('express')
const multer = require('multer')
const auth = require('../middleware/auth')
const sharp = require('sharp')
const User = require('../models/user')
const { sendWelcomeEmail, sendCancelationEmail } = require('../email/account')
const router = express.Router()


// CREATE USER
router.post('/users', async (req, res) => {
    const user = new User(req.body);
    try {
        await user.save()
        sendWelcomeEmail(user.email,user.name)
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
        sendCancelationEmail(req.user.email, req.user.name)
        res.send(req.user)
    } catch (error) {
        res.status(500).send()
    }
})

// UPLOAD
const upload = multer({
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

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if(!user || !user.avatar) {
            throw new Error()
        }
        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch (error) {
        res.status(404).send()
    }
})

module.exports = router