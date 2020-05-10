import db from '../../../models/db'
import {initMockDB, jobs, refers, resumes, users} from '../../../mocks/dbObjects'
import {generateJWT} from '../../../utils/auth'
import request from 'supertest'
import app from '../../../app'
import ReferModel from '../../../models/ReferModel'
import ResumeModel from '../../../models/ResumeModel'
import UserModel from '../../../models/UserModel'
import JobModel from '../../../models/JobModel'
import {REFER_STATES} from '../../../constants/status'
import {ROLES} from '../../../constants/roles'

const refersRoute = '/api/refers'
const refersStatusRoute = '/api/refers/status'
const [user1, user2, user3] = users
const [expiredJob1, job1, job2] = jobs
const [refer2, refer3] = refers
const [resume2] = resumes

const agent = request(app)

describe('RefersCtrlr', () => {
  beforeAll(async () => {
    await db.sync({force: true})
    await initMockDB()
  })
  afterAll(async () => await db.close())

  describe('getReferList', () => {
    it('查看自己所有的 Refer', async () => {
      const jwtToken = generateJWT(user2.userId)
      const {status, body} = await agent
        .get(refersRoute)
        .query({role: ROLES.my, page: 1, limit: 10})
        .set('Authorization', jwtToken)

      expect(status).toEqual(200)

      const {total, referList} = body
      expect(total).toEqual(1)
      expect(referList.length).toEqual(1)
    })
    it('查看别人的所有 Refer', async () => {
      const jwtToken = generateJWT(user1.userId)
      const {status, body} = await agent
        .get(refersRoute)
        .query({role: ROLES.other, page: 1, limit: 10})
        .set('Authorization', jwtToken)

      expect(status).toEqual(200)

      const {total, referList} = body
      expect(total).toEqual(1)
      expect(referList.length).toEqual(1)
    })
    it('参数不正确', async () => {
      const jwtToken = generateJWT(user1.userId)
      const {status, body} = await agent
        .get(refersRoute)
        .set('Authorization', jwtToken)

      expect(status).toEqual(422)
      expect(body.message).toEqual('参数不正确')

      const {status: status2, body: body2} = await agent
        .get(refersRoute)
        .query({page: -1, limit: 4})
        .set('Authorization', jwtToken)

      expect(status2).toEqual(422)
      expect(body2.message).toEqual('参数不正确')
    })
  })

  describe('getRefer', () => {
    it('查看自己的 Refer', async () => {
      const jwtToken = generateJWT(user2.userId)
      const {status, body: refer} = await agent
        .get(`${refersRoute}/${refer2.referId}`)
        .set('Authorization', jwtToken)

      expect(status).toEqual(200)
      expect(refer.referId).toEqual(refer2.referId)
      expect(refer.resume).not.toBeUndefined()
      expect(refer.job).not.toBeUndefined()
      expect(refer.referer).not.toBeUndefined()
      expect(refer.referee).not.toBeUndefined()
    })
    it('获取不存在的 Refer', async () => {
      const jwtToken = generateJWT(user1.userId)
      const {status, body} = await agent
        .get(`${refersRoute}/refer-99`)
        .set('Authorization', jwtToken)

      expect(status).toEqual(404)
      expect(body.message).toEqual('该内推不存在')
    })
    it('有权限查看别人的 Refer', async () => {
      const jwtToken = generateJWT(user1.userId)
      const {status, body: refer} = await agent
        .get(`${refersRoute}/${refer2.referId}`)
        .set('Authorization', jwtToken)

      expect(status).toEqual(200)
      expect(refer.referId).toEqual(refer2.referId)
    })
    it('无权限查看别人的 Refer', async () => {
      const jwtToken = generateJWT(user3.userId)
      const {status, body} = await agent
        .get(`${refersRoute}/${refer2.referId}`)
        .set('Authorization', jwtToken)

      expect(status).toEqual(403)
      expect(body.message).toEqual('无权限访问该内推')
    })
  })

  describe('createRefer', () => {
    it('成功申请 Refer', async () => {
      const jwtToken = generateJWT(user1.userId)
      const referForm = {
        email: user1.email,
        phone: user1.phone,
        experience: user1.experience
      }
      const prevDbJob = await JobModel.findByPk(job2.jobId)
      const prevAppliedCount = prevDbJob!.appliedCount

      const {status, body: refer} = await agent
        .post(`${refersRoute}/${job2.jobId}`)
        .send(referForm)
        .set('Authorization', jwtToken)

      expect(status).toEqual(201)
      expect(refer.phone).toEqual(user1.phone)

      const dbRefer = await ReferModel.findOne({where: {referId: refer.referId}})
      expect(dbRefer).not.toBeNull()
      // 外键
      expect(dbRefer!.refereeId).toEqual(user1.userId)
      expect(dbRefer!.refererId).toEqual(user2.userId)
      expect(dbRefer!.jobId).toEqual(job2.jobId)

      const nowDbJob = await JobModel.findByPk(job2.jobId)
      expect(nowDbJob!.appliedCount).toEqual(prevAppliedCount + 1)
    })
    it('申请不存在的内推职位', async () => {
      const {status, body} = await agent
        .post(`${refersRoute}/job-99`)
        .send({})

      expect(status).toEqual(404)
      expect(body.message).toEqual('该内推职位不存在')
    })
    it('申请已申请过的内推职位', async () => {
      const {status, body} = await agent
        .post(`${refersRoute}/${job1.jobId}`)
        .send({email: user2.email})

      expect(status).toEqual(403)
      expect(body.message).toEqual('你已申请该内推职位或这是你创建的内推职位')
    })
    it('申请自己创建的内推职位', async () => {
      const {status, body} = await agent
        .post(`${refersRoute}/${job1.jobId}`)
        .send({email: user1.email})

      expect(status).toEqual(403)
      expect(body.message).toEqual('你已申请该内推职位或这是你创建的内推职位')
    })
    it('不存在用户申请内推', async () => {
      const {status, body: refer} = await agent
        .post(`${refersRoute}/${job1.jobId}`)
        .send({email: 'user99@mail.com'})

      expect(status).toEqual(201)

      const dbUser = await UserModel.findOne({where: {email: 'user99@mail.com'}})
      expect(dbUser).not.toBeNull()

      const dbRefer = await ReferModel.findOne({where: {referId: refer.referId}})
      expect(dbRefer).not.toBeNull()
    })
  })

  describe('editRefer', () => {
    it('修改自己的 Refer', async () => {
      const jwtToken = generateJWT(user2.userId)
      const patchReferForm = {phone: '12345678'}

      const {status, body: refer} = await agent
        .patch(`${refersRoute}/${refer2.referId}`)
        .send(patchReferForm)
        .set('Authorization', jwtToken)

      expect(status).toEqual(200)
      expect(refer.phone).toEqual('12345678')

      const dbRefer = await ReferModel.findByPk(refer2.referId)
      expect(dbRefer!.phone).toEqual('12345678')
    })
    it('修改别人的 Refer', async () => {
      const jwtToken = generateJWT(user2.userId)
      const patchReferForm = {phone: '12345678'}

      const {status, body} = await agent
        .patch(`${refersRoute}/${refer3.referId}`)
        .send(patchReferForm)
        .set('Authorization', jwtToken)

      expect(status).toEqual(403)
      expect(body.message).toEqual('无权限访问该内推')
    })
  })

  describe('updateReferStatus', () => {
    it('成功更新 Refer 状态', async () => {
      const prevStatus = refer2.status
      expect(prevStatus).toEqual(REFER_STATES.processing)

      const jwtToken = generateJWT(user1.userId)
      const {status, body: refer} = await agent
        .patch(`${refersStatusRoute}/${refer2.referId}`)
        .send({status: REFER_STATES.rejected})
        .set('Authorization', jwtToken)

      expect(status).toEqual(200)
      expect(refer.status).toEqual(REFER_STATES.rejected)

      const dbRefer = await ReferModel.findByPk(refer2.referId)
      expect(dbRefer!.status).toEqual(REFER_STATES.rejected)
      // 恢复
      dbRefer!.status = REFER_STATES.processing
      await dbRefer!.save()
    })
    it('参数要有 status 字段', async () => {
      const jwtToken = generateJWT(user1.userId)
      const {status, body} = await agent
        .patch(`${refersStatusRoute}/${refer2.referId}`)
        .send({phone: '12345678'})
        .set('Authorization', jwtToken)

      expect(status).toEqual(422)
      expect(body.message).toEqual('参数不正确')
    })
    it('非内推人不能修改状态', async () => {
      const jwtToken = generateJWT(user2.userId)
      const {status, body} = await agent
        .patch(`${refersStatusRoute}/${refer2.referId}`)
        .send({status: REFER_STATES.rejected})
        .set('Authorization', jwtToken)

      expect(status).toEqual(403)
      expect(body.message).toEqual('无权限访问该内推')
    })
  })

  describe('deleteRefer', () => {
    it('成功删除 Refer', async () => {
      const jwtToken = generateJWT(user2.userId)

      const {status} = await agent
        .delete(`${refersRoute}/${refer2.referId}`)
        .set('Authorization', jwtToken)

      expect(status).toEqual(200)

      const dbDeletedRefer = await ReferModel.findByPk(refer2.referId)
      expect(dbDeletedRefer).toBeNull()

      const dbDeletedResume = await ResumeModel.findByPk(resume2.resumeId)
      expect(dbDeletedResume).toBeNull()
    })
    it('无权限删除 Refer', async () => {
      const jwtToken = generateJWT(user2.userId)

      const {status, body} = await agent
        .delete(`${refersRoute}/${refer3.referId}`)
        .set('Authorization', jwtToken)

      expect(status).toEqual(403)
      expect(body.message).toEqual('无权限访问该内推')
    })
  })
})
