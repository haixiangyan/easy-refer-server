import request from 'supertest'
import bcrypt from 'bcrypt'
import app from '@/app'
import {initMockDB, jobs, users} from '../../../mocks/dbObjects'
import {generateJWT} from '../../../utils/auth'
import UserModel from '../../../models/UserModel'
import db from '../../../models/db'

const loginRoute = '/api/auth/login'
const registerRoute = '/api/auth/register'
const userRoute = '/api/auth/user'

const [user1, user2] = users
const [job1] = jobs

describe('/auth', () => {
  beforeAll(async () => {
    await db.sync({force: true})
    await initMockDB()
  })
  afterAll(async () => await db.close())

  describe('post /login', () => {
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

  describe('get /user', () => {
    it('成功获取 user-1', async () => {
      const jwtToken = generateJWT('user-1')
      const {body} = await request(app)
        .get(userRoute)
        .set('Authorization', jwtToken)
      const {info, job, resume} = body

      expect(info.userId).toEqual(user1.userId)
      expect(info.email).toEqual(user1.email)

      expect(job.jobId).toEqual(job1.jobId)

      expect(resume).toBeNull()

      expect(info.myReferTotal).toEqual(0)
      expect(info.approvedMyReferCount).toEqual(0)
      expect(info.otherReferTotal).toEqual(1)
      expect(info.approvedOtherReferCount).toEqual(0)
    })
    it ('成功获取 user-2', async () => {
      const jwtToken = generateJWT('user-2')
      const {body} = await request(app)
        .get(userRoute)
        .set('Authorization', jwtToken)
      const {info, job, resume} = body

      expect(info.userId).toEqual(user2.userId)
      expect(info.email).toEqual(user2.email)

      expect(job).toBeNull()

      expect(resume).not.toBeNull()

      expect(info.myReferTotal).toEqual(1)
      expect(info.approvedMyReferCount).toEqual(0)
      expect(info.otherReferTotal).toEqual(0)
      expect(info.approvedOtherReferCount).toEqual(0)
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

  describe('post /register', () => {
    it('用户注册成功', async () => {
      const registrationForm = {
        email: 'user99@mail.com',
        password: '123456'
      }

      const {body: responseUser} = await request(app)
        .post(registerRoute)
        .send(registrationForm)

      const insertedUser = await UserModel.findOne({
        where: {email: registrationForm.email}
      })

      expect(insertedUser).not.toBeNull()
      expect(responseUser.email).toEqual(registrationForm.email)

      if (insertedUser) {
        expect(insertedUser.email).toEqual(registrationForm.email)
        expect(bcrypt.compareSync(registrationForm.password, insertedUser.password)).toBe(true)

        // 删除新建的用户
        await insertedUser.destroy()
      }
    })
    it('已存在的用户不能注册', async () => {
      const registrationForm = {
        email: user1.email,
        password: user1.password
      }

      let userCount = await UserModel.count({
        where: {email: registrationForm.email}
      })

      expect(userCount).toEqual(1)

      const {status, body} = await request(app)
        .post(registerRoute)
        .send(registrationForm)

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
