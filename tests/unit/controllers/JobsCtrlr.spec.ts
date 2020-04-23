import db from '../../../models/db'
import {initMockDB, users} from '../../../mocks/dbObjects'
import request from 'supertest'
import app from '../../../app'
import {generateJWT} from '../../../utils/auth'
import JobModel from '../../../models/JobModel'
import dayjs = require('dayjs')

const jobListRoute = '/api/jobs'

const [user1, user2, user3] = users

const agent = request(app)

describe('JobsCtrlr', () => {
  beforeAll(async () => {
    await db.sync({force: true})
    await initMockDB()
  })
  afterAll(async () => await db.close())

  describe('getJobList', () => {
    it('成功获取 Job List', async () => {
      const {status, body} = await agent
        .get(jobListRoute)
        .query({page: 1, limit: 10})

      const {jobList, total} = body

      expect(status).toEqual(200)
      expect(jobList.length).toBeLessThanOrEqual(10)
      expect(total).toEqual(2)

      expect(jobList[0]).toHaveProperty('referredCount')
      expect(jobList[0]).toHaveProperty('processedChart')
      expect(jobList[0].processedChart).not.toBeNull()
      expect(jobList[0].processedChart.length).toEqual(10)
    })
    it('传错 page 和 limit 参数', async () => {
      const {status, body} = await agent
        .get(jobListRoute)

      expect(status).toEqual(422)
      expect(body.message).toEqual('参数不正确')

      const {status: status2, body: body2} = await agent
        .get(jobListRoute)
        .query({page: -1, limit: 4})

      expect(status2).toEqual(422)
      expect(body2.message).toEqual('参数不正确')
    })
  })

  describe('getJob', () => {
    it('成功获取 Job', async () => {
      const {status, body: job} = await agent
        .get(`${jobListRoute}/job-1`)

      expect(status).toEqual(200)
      expect(job).toHaveProperty('referredCount')
      expect(job).toHaveProperty('processedChart')
      expect(job.processedChart).not.toBeNull()
      expect(job.processedChart.length).toEqual(10)
      expect(job.referer).not.toBeNull()
    })
    it('不存在 Job', async () => {
      const {status, body} = await agent
        .get(`${jobListRoute}/job-99`)

      expect(status).toEqual(404)
      expect(body.message).toEqual('该内推职位不存在')
    })
  })

  describe('createJob', () => {
    it('成功创建一个 Job', async () => {
      const jwtToken = generateJWT(user3.userId)
      const jobForm = {
        company: 'google',
        requiredFields: ['name', 'email', 'phone', 'experience'],
        deadline: dayjs().add(10, 'month').toISOString(),
        autoRejectDay: 5,
        referTotal: 100,
        source: ''
      }

      const {status, body: job} = await agent
        .post(jobListRoute)
        .send(jobForm)
        .set('Authorization', jwtToken)

      expect(status).toEqual(201)
      Object.entries(jobForm).forEach(([key, value]) => {
        if (key === 'requiredFields') {
          return expect(job[key]).toStrictEqual(jobForm.requiredFields)
        }
        if (key === 'deadline') {
          return expect(job[key]).toEqual(jobForm.deadline)
        }
        expect(job[key]).toEqual(value)
      })

      // 去掉新生成的 Job
      await JobModel.destroy({where: {jobId: job!.jobId}})
    })
    it('已经创建过 Job', async () => {
      const jwtToken = generateJWT(user1.userId)

      const {status, body} = await agent
        .post(jobListRoute)
        .send({})
        .set('Authorization', jwtToken)

      expect(status).toEqual(409)
      expect(body.message).toEqual('你已创建内推职位')
    })
    it('创建过期的 Job', async () => {
      const jwtToken = generateJWT(user3.userId)
      const jobForm = {
        company: 'google',
        requiredFields: ['name', 'email', 'phone', 'experience'],
        deadline: dayjs().subtract(10, 'day').toDate(),
        expiration: 5,
        referTotal: 100,
        source: ''
      }

      const {status, body} = await agent
        .post(jobListRoute)
        .send(jobForm)
        .set('Authorization', jwtToken)

      expect(status).toEqual(412)
      expect(body.message).toEqual('截止日期应该在今天之后')
    })
  })

  describe('editJob', () => {
    it('成功修改 Job', async () => {
      const jwtToken = generateJWT(user1.userId)
      const jobForm = {company: 'New Company',}

      const {status, body: job} = await agent
        .put(`${jobListRoute}/job-1`)
        .send(jobForm)
        .set('Authorization', jwtToken)

      expect(status).toEqual(200)
      expect(job.company).toEqual(jobForm.company)

      const dbJob = await JobModel.findByPk('job-1')
      expect(dbJob).not.toBeNull()
      expect(dbJob!.company).toEqual(jobForm.company)
    })
    it('修改不存在的 Job', async () => {
      const jwtToken = generateJWT(user1.userId)
      const jobForm = {company: 'New Company',}

      const {status, body} = await agent
        .put(`${jobListRoute}/job-99`)
        .send(jobForm)
        .set('Authorization', jwtToken)

      expect(status).toEqual(404)
      expect(body.message).toEqual('该内推职不存在')
    })
    it('无权限修改 Job', async () => {
      const jwtToken = generateJWT(user1.userId)
      const jobForm = {company: 'New Company',}

      const {status, body} = await agent
        .put(`${jobListRoute}/job-2`)
        .send(jobForm)
        .set('Authorization', jwtToken)

      expect(status).toEqual(403)
      expect(body.message).toEqual('无权限修改该内推职位')
    })
  })
})
