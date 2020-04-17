import request from 'supertest'
import db from '@/models/db'
import app from '@/app'
import {users, jobs, resumes, initMockDB} from '../../../mocks/dbObjects'
import {generateJWT} from '../../../utils/auth'
import dayjs = require('dayjs')
import {DATETIME_FORMAT} from '../../../constants/format'

const loginRoute = '/api/auth/login'
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
    it('成功登录', async () => {
      const response = await request(app)
        .post(loginRoute)
        .send(user1)

      expect(response.status).toEqual(200)
      expect(response.body).toHaveProperty('token')
    })
    it('用户不存在，登录失败', async () => {
      const invalidUser = {...user1, email: 'invalid-user@mail.com'}

      const response = await request(app)
        .post(loginRoute)
        .send(invalidUser)

      expect(response.status).toEqual(401)
      expect(response.body).toHaveProperty('message')
      expect(response.body.message).toEqual('用户不存在')
    })
    it('密码不正确，登录失败', async () => {
      const invalidUser = {...user1, password: '123'}

      const response = await request(app)
        .post(loginRoute)
        .send(invalidUser)

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
})
