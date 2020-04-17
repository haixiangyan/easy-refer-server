import request from 'supertest'
import db from '@/models/db'
import app from '@/app'
import {initMockDB} from '../../../mocks/dbObjects'

const loginRoute = '/api/auth/login'
const user = {
  email: 'user1@mail.com',
  password: '123456'
}

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
        .post(loginRoute)
        .send(user)

      expect(res.status).toEqual(200)
      expect(res.body).toHaveProperty('token')
    })
    it('用户不存在，登录失败', async () => {
      const invalidUser = {...user, email: 'invalid-user@mail.com'}

      const res: request.Response = await request(app)
        .post(loginRoute)
        .send(invalidUser)

      expect(res.status).toEqual(401)
      expect(res.body).toHaveProperty('message')
      expect(res.body.message).toEqual('用户不存在')
    })
    it('密码不正确，登录失败', async () => {
      const invalidUser = {...user, password: '123'}

      const res: request.Response = await request(app)
        .post(loginRoute)
        .send(invalidUser)

      expect(res.status).toEqual(401)
      expect(res.body).toHaveProperty('message')
      expect(res.body.message).toEqual('密码不正确')
    })
  })
})
