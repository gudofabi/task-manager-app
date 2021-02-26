const request = require('supertest')
const app = require('../src/app')
const Task = require('../src/models/task');
const { userOne, setupDatabase } = require('./fixtures/db');

jest.useFakeTimers()

beforeEach(setupDatabase);

test('Should create task for the user', async () => {
    const response = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            description: 'Form my test'
        })
        .expect(201)
    
        const task = await Task.findById(response.body._id)
        expect(task).not.toBeNull()
        expect(task.completed).toEqual(false)
});