import db from '../../../models/db'
import {initMockDB} from '../../../mocks/dbObjects'
import {generateJWT} from '../../../utils/auth'
import request from 'supertest'
import app from '../../../app'

const refersRoute = '/api/refers'

describe('/refers', () => {
  beforeAll(async () => {
    await db.sync({force: true})
    await initMockDB()
  })
  afterAll(async () => await db.close())

  describe('get /:referId', () => {
    it('查看自己的 Refer', async () => {
      const jwtToken = generateJWT('user-2')
      const {status, body: refer} = await request(app)
        .get(`${refersRoute}/refer-2`)
        .set('Authorization', jwtToken)

      expect(status).toEqual(200)
      expect(refer.referId).toEqual('refer-2')
    })
    it('有权限查看别人的 Refer', async () => {
      const jwtToken = generateJWT('user-1')
      const {status, body: refer} = await request(app)
        .get(`${refersRoute}/refer-2`)
        .set('Authorization', jwtToken)

      expect(status).toEqual(200)
      expect(refer.referId).toEqual('refer-2')
    })
    it('无权限查看别人的 Refer', async () => {
      const jwtToken = generateJWT('user-3')
      const {status, body} = await request(app)
        .get(`${refersRoute}/refer-2`)
        .set('Authorization', jwtToken)

      expect(status).toEqual(403)
      expect(body.message).toEqual('无权限访问该内推')
    })
  })
})
