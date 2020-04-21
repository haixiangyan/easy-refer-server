import request from 'supertest'
import bcrypt from 'bcrypt'
import app from '@/app'
import {initMockDB, users} from '../../../mocks/dbObjects'
import UserModel from '../../../models/UserModel'
import db from '../../../models/db'

const loginRoute = '/api/auth/login'
const registerRoute = '/api/auth/register'

const [user1] = users

const agent = request(app)

describe('AuthRoute 路由', () => {
  beforeAll(async () => {
    await db.sync({force: true})
    await initMockDB()
  })
  afterAll(async () => await db.close())

  describe('登录 post /auth/login', () => {
    const loginForm = {
      email: user1.email,
      password: user1.password
    }
    it('成功登录', async () => {
      const response = await agent
        .post(loginRoute)
        .send(loginForm)

      expect(response.status).toEqual(200)
      expect(response.body).toHaveProperty('token')
    })
    it('用户不存在，登录失败', async () => {
      const invalidLoginForm = {...loginForm, email: 'user99@mail.com'}

      const response = await agent
        .post(loginRoute)
        .send(invalidLoginForm)

      expect(response.status).toEqual(401)
      expect(response.body).toHaveProperty('message')
      expect(response.body.message).toEqual('用户不存在')
    })
    it('密码不正确，登录失败', async () => {
      const invalidLoginForm = {...loginForm, password: '123'}

      const response = await agent
        .post(loginRoute)
        .send(invalidLoginForm)

      expect(response.status).toEqual(401)
      expect(response.body).toHaveProperty('message')
      expect(response.body.message).toEqual('密码不正确')
    })
  })

  describe('注册 /auth/register', () => {
    it('用户注册成功', async () => {
      const registrationForm = {
        email: 'user99@mail.com',
        password: '123456'
      }

      const {status, body: user} = await agent
        .post(registerRoute)
        .send(registrationForm)

      expect(status).toEqual(201)

      const dbUser = await UserModel.findOne({
        where: {email: registrationForm.email}
      })

      expect(dbUser).not.toBeNull()
      expect(user.email).toEqual(registrationForm.email)

      if (dbUser) {
        expect(dbUser.email).toEqual(registrationForm.email)
        expect(bcrypt.compareSync(registrationForm.password, dbUser.password)).toBe(true)

        // 删除新建的用户
        await dbUser.destroy()
      }
    })
    it('已存在的用户不能注册', async () => {
      const registrationForm = {
        email: user1.email,
        password: user1.password
      }

      let dbUserCount = await UserModel.count({
        where: {email: registrationForm.email}
      })

      expect(dbUserCount).toEqual(1)

      const {status, body} = await agent
        .post(registerRoute)
        .send(registrationForm)

      expect(status).toEqual(409)
      expect(body).toHaveProperty('message')
      expect(body.message).toEqual('该用户已存在')

      dbUserCount = await UserModel.count({
        where: {email: registrationForm.email}
      })

      expect(dbUserCount).toEqual(1)
    })
  })
})
