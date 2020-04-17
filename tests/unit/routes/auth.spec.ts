import request from 'supertest'
import db from '@/models/db'
import app from '@/app'
import {initMockDB} from '../../../mocks/dbObjects'

describe('auth', () => {
  beforeAll(async () => {
    await db.sync({force: true})
    await initMockDB()
  })
  afterAll(async () => {
    await db.close()
  })
  describe('/login', () => {
    it('成功登录', async () => {
      const res: request.Response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user1@mail.com',
          password: '123456'
        })
      expect(res.status).toEqual(200)
      expect(res.body).toHaveProperty('token')
    })
  })
})
