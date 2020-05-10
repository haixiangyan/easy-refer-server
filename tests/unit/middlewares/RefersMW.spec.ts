import db from '../../../models/db'
import {initMockDB, users} from '../../../mocks/dbObjects'
import {generateJWT} from '../../../utils/auth'
import request from 'supertest'
import app from '../../../app'

const refersRoute = '/api/refers'
const [user1] = users

const agent = request(app)

describe('RefersMW', () => {
  beforeAll(async () => {
    await db.sync({force: true})
    await initMockDB()
  })
  afterAll(async () => await db.close())

  describe('existRefer', () => {
    it('检测不存在 Refer', async () => {
      const jwtToken = generateJWT(user1.userId)

      const {status, body} = await agent
        .delete(`${refersRoute}/refer-99`)
        .set('Authorization', jwtToken)

      expect(status).toEqual(404)
      expect(body.message).toEqual('该内推不存在')
    })
  })
})
