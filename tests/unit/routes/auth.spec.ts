import request from 'supertest'
import db from '@/models/db'
import app from '@/app'
import {initMockDB, jobs, resumes, users} from '../../../mocks/dbObjects'
import {generateJWT} from '../../../utils/auth'
import {DATETIME_FORMAT} from '../../../constants/format'
import UserModel from '../../../models/UserModel'
import dayjs = require('dayjs')

const loginRoute = '/api/auth/login'
const registerRoute = '/api/auth/register'
const userRoute = '/api/auth/user'

const [user1] = users
const [job1] = jobs
const [resume1] = resumes

describe('auth', () => {
  beforeAll(async () => {
    await db.sync({force: true})
    await initMockDB()
  })
  afterAll(async () => await db.close())

  describe('/login', () => {
    const loginForm = {
      email: user1.email,
      password: user1.password
    }
    it('成功登录', async () => {
      const response = await request(app)
        .post(loginRoute)
        .send(loginForm)

      expect(response.status).toEqual(200)
      expect(response.body).toHaveProperty('token')
    })
    it('用户不存在，登录失败', async () => {
      const invalidLoginForm = {...loginForm, email: 'invalid-user@mail.com'}

      const response = await request(app)
        .post(loginRoute)
        .send(invalidLoginForm)

      expect(response.status).toEqual(401)
      expect(response.body).toHaveProperty('message')
      expect(response.body.message).toEqual('用户不存在')
    })
    it('密码不正确，登录失败', async () => {
      const invalidLoginForm = {...loginForm, password: '123'}

      const response = await request(app)
        .post(loginRoute)
        .send(invalidLoginForm)

      expect(response.status).toEqual(401)
      expect(response.body).toHaveProperty('message')
      expect(response.body.message).toEqual('密码不正确')
    })
  })

  describe('/user', () => {
    it('成功获取 user-1', async () => {
      const jwtToken = generateJWT('user-1')
      const {body: user} = await request(app)
        .get(userRoute)
        .set('Authorization', jwtToken)

      // 去掉 updatedAt 和 createdAt 字段
      delete user.updatedAt
      delete user.createdAt
      delete user.job.updatedAt
      delete user.job.createdAt
      delete user.resumeList[0].updatedAt
      delete user.resumeList[0].createdAt

      const expectedUser = {
        ...user1,
        job: {...job1},
        resumeList: [{...resume1}]
      }

      expect(dayjs(user.job.deadline).format(DATETIME_FORMAT)).toEqual(dayjs(expectedUser.job.deadline).format(DATETIME_FORMAT))

      delete user.job.deadline
      delete expectedUser.job.deadline

      expect(user).toStrictEqual(expectedUser)
    })
    it('没有 token 不能获取 user-1', async () => {
      const {status, body, text} = await request(app)
        .get(userRoute)

      expect(status).toEqual(401)
      expect(body).toStrictEqual({})
      expect(text).toEqual('Unauthorized')
    })
    it('不存在该用户', async () => {
      const jwtToken = generateJWT('user-999')
      const {status, body} = await request(app)
        .get(userRoute)
        .set('Authorization', jwtToken)

      expect(status).toEqual(404)
      expect(body).toHaveProperty('message')
      expect(body.message).toEqual('该用户不存在')
    })
  })

  describe('/register', () => {
    const registrationForm = {
      email: 'user3@mail.com',
      password: user1.password
    }
    it('用户注册成功', async () => {
      const {body: user} = await request(app)
        .post(registerRoute)
        .send(registrationForm)

      const insertedUser = await UserModel.findOne({
        where: {email: registrationForm.email}
      })

      expect(insertedUser).not.toBeNull()
      expect(user.email).toEqual(registrationForm.email)
      expect(insertedUser!.email).toEqual(registrationForm.email)
      expect(insertedUser!.password).toEqual(registrationForm.password)
    })
    it('已存在的用户不能注册', async () => {
      let userCount = await UserModel.count({
        where: {email: registrationForm.email}
      })

      expect(userCount).toEqual(1)

      const {status, body} = await request(app)
        .post(registerRoute)
        .send({...registrationForm, email: 'user1@mail.com'})

      userCount = await UserModel.count({
        where: {email: registrationForm.email}
      })

      expect(userCount).toEqual(1)
      expect(status).toEqual(403)
      expect(body).toHaveProperty('message')
      expect(body.message).toEqual('该用户已存在')
    })
  })
})
