import request from 'supertest'
import db from '@/models/db'
import app from '@/app'
import {users, jobs, resumes, initMockDB} from '../../../mocks/dbObjects'
import {generateJWT} from '../../../utils/auth'

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
    it('成功获取 user1', async () => {
      const userInfo = {
        info: {...user1},
        job: {...job1},
        resume: {...resume1}
      }
      const jwtToken = generateJWT('user1')
      const response = await request(app)
        .get(userRoute)
        .set('Authorization', jwtToken)

      console.log(response.body)
    })
  })
})
