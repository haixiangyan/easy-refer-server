import db from '../../../models/db'
import {initMockDB} from '../../../mocks/dbObjects'
import {generateJWT} from '../../../utils/auth'
import request from 'supertest'
import app from '../../../app'
import ReferModel from '../../../models/ReferModel'
import ResumeModel from '../../../models/ResumeModel'

const refersRoute = '/api/refers'

describe('RefersCtrlr', () => {
  beforeAll(async () => {
    await db.sync({force: true})
    await initMockDB()
  })
  afterAll(async () => await db.close())

  describe('getReferList', () => {
    it('查看自己所有的 Refer', async () => {
      const jwtToken = generateJWT('user-2')
      const {status, body} = await request(app)
        .get(refersRoute)
        .query({role: 'my', page: 1, limit: 10})
        .set('Authorization', jwtToken)

      expect(status).toEqual(200)

      const {total, referList} = body
      expect(total).toEqual(1)
      expect(referList.length).toEqual(1)
    })
    it('查看别人的所有 Refer', async () => {
      const jwtToken = generateJWT('user-1')
      const {status, body} = await request(app)
        .get(refersRoute)
        .query({role: 'other', page: 1, limit: 10})
        .set('Authorization', jwtToken)

      expect(status).toEqual(200)

      const {total, referList} = body
      expect(total).toEqual(2)
      expect(referList.length).toEqual(2)
    })
    it('缺少参数', async () => {
      const jwtToken = generateJWT('user-1')
      const {status, body} = await request(app)
        .get(refersRoute)
        .set('Authorization', jwtToken)

      expect(status).toEqual(422)
      expect(body.message).toEqual('缺少参数')
    })
  })

  describe('getRefer', () => {
    it('查看自己的 Refer', async () => {
      const jwtToken = generateJWT('user-2')
      const {status, body: refer} = await request(app)
        .get(`${refersRoute}/refer-2`)
        .set('Authorization', jwtToken)

      expect(status).toEqual(200)
      expect(refer.referId).toEqual('refer-2')
    })
    it('获取不存在的 Refer', async () => {
      const jwtToken = generateJWT('user-1')
      const {status, body} = await request(app)
        .get(`${refersRoute}/refer-99`)
        .set('Authorization', jwtToken)

      expect(status).toEqual(404)
      expect(body.message).toEqual('该内推不存在')
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

  describe('createRefer', () => {
    it('成功申请 Refer', async () => {
      const jwtToken = generateJWT('user-1')
      const referForm = {
        email: 'user1@mail.com',
        phone: '12345678',
        experience: 2,
      }

      const {status, body: refer} = await request(app)
        .post(`${refersRoute}/job-2`)
        .send(referForm)
        .set('Authorization', jwtToken)

      expect(status).toEqual(200)
      expect(refer.phone).toEqual('12345678')

      const dbRefer = await ReferModel.findOne({where: {email: 'user1@mail.com'}})
      expect(dbRefer).not.toBeNull()
      // 外键
      expect(dbRefer!.refereeId).toEqual('user-1')
      expect(dbRefer!.refererId).toEqual('user-2')
      expect(dbRefer!.jobId).toEqual('job-2')
    })
    it('申请不存在的内推职位', async () => {
      const jwtToken = generateJWT('user-1')

      const {status, body} = await request(app)
        .post(`${refersRoute}/job-99`)
        .send({})
        .set('Authorization', jwtToken)

      expect(status).toEqual(404)
      expect(body.message).toEqual('该内推职位不存在')
    })
    it('申请已申请过的内推职位', async () => {
      const jwtToken = generateJWT('user-2')

      const {status, body} = await request(app)
        .post(`${refersRoute}/job-1`)
        .send({})
        .set('Authorization', jwtToken)

      expect(status).toEqual(403)
      expect(body.message).toEqual('你已申请该内推职位或这是你创建的内推职位')
    })
    it('申请自己创建的内推职位', async () => {
      const jwtToken = generateJWT('user-1')

      const {status, body} = await request(app)
        .post(`${refersRoute}/job-1`)
        .send({})
        .set('Authorization', jwtToken)

      expect(status).toEqual(403)
      expect(body.message).toEqual('你已申请该内推职位或这是你创建的内推职位')
    })
  })

  describe('editRefer', () => {
    it('修改自己的 Refer', async () => {
      const jwtToken = generateJWT('user-2')
      const patchReferForm = {phone: '12345678'}

      const {status, body: refer} = await request(app)
        .patch(`${refersRoute}/refer-2`)
        .send(patchReferForm)
        .set('Authorization', jwtToken)

      expect(status).toEqual(200)
      expect(refer.phone).toEqual('12345678')

      const dbRefer = await ReferModel.findByPk('refer-2')
      expect(dbRefer!.phone).toEqual('12345678')
    })
    it('修改不存在的 Refer', async () => {
      const jwtToken = generateJWT('user-2')
      const patchReferForm = {phone: '12345678'}

      const {status, body: refer} = await request(app)
        .patch(`${refersRoute}/refer-99`)
        .send(patchReferForm)
        .set('Authorization', jwtToken)

      expect(status).toEqual(404)
      expect(refer.message).toEqual('该内推不存在')
    })
    it('修改别人的 Refer', async () => {
      const jwtToken = generateJWT('user-2')
      const patchReferForm = {phone: '12345678'}

      const {status, body: refer} = await request(app)
        .patch(`${refersRoute}/refer-3`)
        .send(patchReferForm)
        .set('Authorization', jwtToken)

      expect(status).toEqual(403)
      expect(refer.message).toEqual('无权限访问该内推')
    })
  })

  describe('deleteRefer', () => {
    it('成功删除 Refer', async () => {
      const jwtToken = generateJWT('user-2')

      const {status} = await request(app)
        .delete(`${refersRoute}/refer-2`)
        .set('Authorization', jwtToken)

      expect(status).toEqual(200)

      const dbDeletedRefer = await ReferModel.findByPk('refer-2')
      expect(dbDeletedRefer).toBeNull()

      const dbDeletedResume = await ResumeModel.findByPk('resume-2')
      expect(dbDeletedResume).toBeNull()
    })
    it('删除不存在的 Refer', async () => {
      const jwtToken = generateJWT('user-2')

      const {status, body} = await request(app)
        .delete(`${refersRoute}/refer-99`)
        .set('Authorization', jwtToken)

      expect(status).toEqual(404)
      expect(body.message).toEqual('该内推不存在')
    })
    it('无权限删除 Refer', async () => {
      const jwtToken = generateJWT('user-2')

      const {status, body} = await request(app)
        .delete(`${refersRoute}/refer-3`)
        .set('Authorization', jwtToken)

      expect(status).toEqual(403)
      expect(body.message).toEqual('无权限访问该内推')
    })
  })
})
