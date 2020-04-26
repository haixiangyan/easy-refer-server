import request from 'supertest'
import bcrypt from 'bcrypt'
import app from '../../../app'
import {initMockDB, users} from '../../../mocks/dbObjects'
import UserModel from '../../../models/UserModel'
import db from '../../../models/db'
import {generateJWT} from '../../../utils/auth'

const loginRoute = '/api/auth/login'
const refreshRoute = '/api/auth/refresh'
const activateRoute = '/api/auth/activate'
const registerRoute = '/api/auth/register'

const [user1, user2, user3, user4] = users

const agent = request(app)

describe('AuthCtrlr', () => {
  beforeAll(async () => {
    await db.sync({force: true})
    await initMockDB()
  })
  afterAll(async () => await db.close())

  describe('login', () => {
    const loginForm = {
      email: user1.email,
      password: '123456'
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
    it('用户需要激活', async () => {
      const invalidLoginForm = {...loginForm, email: 'user4@mail.com', password: '123'}

      const response = await agent
        .post(loginRoute)
        .send(invalidLoginForm)

      expect(response.status).toEqual(401)
      expect(response.body).toHaveProperty('message')
      expect(response.body.message).toEqual('该用户需要激活使用')
    })
  })

  describe('refresh', () => {
    it('成功更新 token', async () => {
      const jwtToken = generateJWT(user1.userId)

      const {status, body} = await agent
        .post(refreshRoute)
        .set('Authorization', jwtToken)

      expect(status).toEqual(200)
      expect(body).toHaveProperty('token')
    })
    it('未登录不能更新 token', async () => {
      const {status} = await agent.post(refreshRoute)
      expect(status).toEqual(401)
    })
  })

  describe('activate', () => {
    it('成功激活用户', async () => {
      const {status, body} = await agent
        .post(activateRoute)
        .send({email: user4.email, password: '123456'})

      expect(status).toEqual(201)
      expect(body).toHaveProperty('token')

      const dbUser = await UserModel.findOne({where: {email: user4.email}})

      expect(bcrypt.compareSync('123456', dbUser!.password)).toEqual(true)
    })
    it('不存在用户不能激活', async () => {
      const {status, body} = await agent
        .post(activateRoute)
        .send({email: 'user99@mail.com', password: '123456'})

      expect(status).toEqual(404)
      expect(body).toHaveProperty('message')
      expect(body.message).toEqual('用户不存在')
    })
    it('已激活用户不能激活', async () => {
      const {status, body} = await agent
        .post(activateRoute)
        .send({email: 'user1@mail.com', password: '123456'})

      expect(status).toEqual(400)
      expect(body).toHaveProperty('message')
      expect(body.message).toEqual('该用户已激活')
    })
  })

  describe('register', () => {
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
      expect(body.message).toEqual('该用户已存在或需要激活')

      dbUserCount = await UserModel.count({
        where: {email: registrationForm.email}
      })

      expect(dbUserCount).toEqual(1)
    })
  })
})
