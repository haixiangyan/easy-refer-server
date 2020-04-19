import request from 'supertest'
import app from '../../../app'
import {generateJWT} from '../../../utils/auth'
import db from '../../../models/db'
import {initMockDB} from '../../../mocks/dbObjects'

const updateUserRoute = '/api/users'

describe('users', () => {
  beforeAll(async () => {
    await db.sync({force: true})
    await initMockDB()
  })
  afterAll(async () => await db.close())
  describe('put /users', () => {
    const userForm: TUserForm = {
      email: 'user1@mail.com',
      name: '修改了的张三',
      experience: 3,
      intro: '修改后的个人介绍',
      phone: '949123456',
      leetCodeUrl: 'http://leetcode/zhangshan',
      thirdPersonIntro: '修改后的第三人称',
      avatarUrl: 'http://avatar/zhangsan'
    }

    it('成功修改 user-1 信息', async () => {
      const jwtToken = generateJWT('user-1')
      const {status, body} = await request(app)
        .put(updateUserRoute)
        .send(userForm)
        .set('Authorization', jwtToken)

      expect(status).toEqual(200)
      expect(body.email).toEqual(userForm.email)
      expect(body.name).toEqual(userForm.name)
      expect(body.experience).toEqual(userForm.experience)
      expect(body.intro).toEqual(userForm.intro)
      expect(body.phone).toEqual(userForm.phone)
      expect(body.leetCodeUrl).toEqual(userForm.leetCodeUrl)
      expect(body.thirdPersonIntro).toEqual(userForm.thirdPersonIntro)
      expect(body.avatarUrl).toEqual(userForm.avatarUrl)

      expect(body.job).toBeUndefined()
      expect(body.resume).toBeUndefined()
    })
    it('不存在的用户不能修改', async () => {
      const jwtToken = generateJWT('user-4')

      const {status, body} = await request(app)
        .put(updateUserRoute)
        .send(userForm)
        .set('Authorization', jwtToken)

      expect(status).toEqual(404)
      expect(body).toHaveProperty('message')
      expect(body.message).toEqual('用户不存在')
    })
  })
})
