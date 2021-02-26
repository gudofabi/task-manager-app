const request = require('supertest') // NOTE: supertest use to test request
const app = require('../src/app')
const User = require('../src/models/user')
const { userOneId, userOne, setupDatabase } = require('./fixtures/db')

jest.useFakeTimers()
/**
 * INFO: it will delete users and create new one before enter on the test
 * 
 */
beforeEach(setupDatabase);

test('Should signup a new user', async () => {
    const response = await request(app).post('/users').send({
        name: 'Gudo Fabi',
        email: 'gudofabi@sample.com',
        password: 's3cr3t!!!'
    }).expect(201)

    // Assert that the database was changed correctly
    const user = await User.findById(response.body.user._id)
    expect(user).not.toBeNull()

    // Assert about the response
    expect(response.body).toMatchObject({
        user: {
            name: 'Gudo Fabi'
        }
    })

    expect(user.password).not.toBe('SampleWrongPassword')
})

test('Should login existing user', async () => {
    const response = await request(app).post('/users/login').send({
        email: userOne.email,
        password: userOne.password
    }).expect(200)

    const user = await User.findById(userOneId)
    expect(response.body.token).toBe(user.tokens[1].token)
})

test('Should not login user', async () => {
    await request(app).post('/users/login').send({
        email: "false@sample.com",
        password: "falsepassword"
    }).expect(400)
})

test('Should get profile for user', async () => {
    await request(app)
            .get('/users/me')
            .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
            .send()
            .expect(200)
})

test('Should not get profile for unauthenticated user', async () => {
    await request(app)
            .get('/users/me')
            .send()
            .expect(401)
})

test('Should delete user account', async () => {
    await request(app)
            .delete('/users/me')
            .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
            .send()
            .expect(200)
    const user = await User.findById(userOneId)
    expect(user).toBeNull()
})

test('Should not delete unauthenticated user', async () => {
    await request(app)
            .delete('/users/me')
            .send()
            .expect(401)
})