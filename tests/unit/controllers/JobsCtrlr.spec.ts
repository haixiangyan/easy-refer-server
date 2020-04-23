import db from '../../../models/db'
import {initMockDB} from '../../../mocks/dbObjects'
import request from 'supertest'
import app from '../../../app'
import {generateJWT} from '../../../utils/auth'
import JobModel from '../../../models/JobModel'
import dayjs = require('dayjs')

const jobItemListRoute = '/api/jobs/items'
const jobListRoute = '/api/jobs'

const agent = request(app)

describe('JobsCtrlr', () => {
  beforeAll(async () => {
    await db.sync({force: true})
    await initMockDB()
  })
  afterAll(async () => await db.close())

  describe('getJobItemList', () => {
    it('成功获取 Job Item List', async () => {
      const {status, body} = await agent
        .get(jobItemListRoute)
        .query({page: 1, limit: 10})

      const {jobItemList, total} = body

      expect(status).toEqual(200)
      expect(jobItemList.length).toBeLessThanOrEqual(10)
      expect(total).toEqual(2)

      expect(jobItemList[0]).toHaveProperty('referredCount')
      expect(jobItemList[0]).toHaveProperty('processedChart')
      expect(jobItemList[0].finishedChart).not.toBeNull()
    })
    it('传错 page 和 limit 参数', async () => {
      const {status, body} = await agent
        .get(jobItemListRoute)

      expect(status).toEqual(422)
      expect(body.message).toEqual('缺少参数')
    })
  })

  describe('getJobItem', () => {
    it('成功获取 Job Item', async () => {
      const {status, body: jobItem} = await agent
        .get(`${jobItemListRoute}/job-1`)

      expect(status).toEqual(200)
      expect(jobItem).toHaveProperty('referredCount')
      expect(jobItem).toHaveProperty('processedChart')
      expect(jobItem.finishedChart).not.toBeNull()
    })
    it('不存在 Job', async () => {
      const {status, body} = await agent
        .get(`${jobItemListRoute}/job-99`)

      expect(status).toEqual(404)
      expect(body.message).toEqual('该内推职位不存在')
    })
  })

  describe('getJob', () => {
    it('成功获取一个 Job', async () => {
      const {status, body: job} = await agent
        .get(`${jobListRoute}/job-1`)

      expect(status).toEqual(200)

      expect(job).toHaveProperty('jobId')
      expect(job.requiredFields instanceof Array).toBe(true)
      expect(job.jobId).toEqual('job-1')
    })
    it('获取不存在的 Job', async () => {
      const {status, body: job} = await agent
        .get(`${jobListRoute}/job-99`)

      expect(status).toEqual(404)

      expect(job).not.toHaveProperty('jobId')
      expect(job).toHaveProperty('message')
      expect(job.message).toEqual('该内推职位不存在')
    })
  })

  describe('createJob', () => {
    it('成功创建一个 Job', async () => {
      const jwtToken = generateJWT('user-3')
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
      const jwtToken = generateJWT('user-1')

      const {status, body} = await agent
        .post(jobListRoute)
        .send({})
        .set('Authorization', jwtToken)

      expect(status).toEqual(409)
      expect(body.message).toEqual('你已创建内推职位')
    })
    it('创建过期的 Job', async () => {
      const jwtToken = generateJWT('user-3')
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
      const jwtToken = generateJWT('user-1')
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
      const jwtToken = generateJWT('user-1')
      const jobForm = {company: 'New Company',}

      const {status, body} = await agent
        .put(`${jobListRoute}/job-99`)
        .send(jobForm)
        .set('Authorization', jwtToken)

      expect(status).toEqual(404)
      expect(body.message).toEqual('该内推职不存在')
    })
    it('无权限修改 Job', async () => {
      const jwtToken = generateJWT('user-1')
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
