import db from '../../../models/db'
import {initMockDB} from '../../../mocks/dbObjects'
import request from 'supertest'
import app from '../../../app'
import {generateJWT} from '../../../utils/auth'
import dayjs = require('dayjs')
import UserModel from '../../../models/UserModel'
import JobModel from '../../../models/JobModel'

const jobItemListRoute = '/api/jobs/items'
const jobListRoute = '/api/jobs'

describe('获取内推职位接口 /jobs', () => {
  beforeAll(async () => {
    await db.sync({force: true})
    await initMockDB()
  })
  afterAll(async () => await db.close())

  describe('获取多个 Job Item 接口 => get /item', () => {
    it('成功获取 Job Item List', async () => {
      const {status, body} = await request(app)
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
      const {status, body} = await request(app)
        .get(jobItemListRoute)

      expect(status).toEqual(422)
      expect(body.message).toEqual('缺少参数')
    })
  })

  describe('获取一个 Job Item 接口 => get /item/:jobId', () => {
    it('成功获取 Job Item', async () => {
      const {status, body: jobItem} = await request(app)
        .get(`${jobItemListRoute}/job-1`)

      expect(status).toEqual(200)
      expect(jobItem).toHaveProperty('referredCount')
      expect(jobItem).toHaveProperty('processedChart')
      expect(jobItem.finishedChart).not.toBeNull()
    })
    it('不存在 Job', async () => {
      const {status, body} = await request(app)
        .get(`${jobItemListRoute}/job-99`)

      expect(status).toEqual(404)
      expect(body.message).toEqual('该内推职位不存在')
    })
  })

  describe('获取一个 Job 接口 => get /:jobId', () => {
    it('成功获取一个 Job', async () => {
      const {status, body: job} = await request(app)
        .get(`${jobListRoute}/job-1`)

      expect(status).toEqual(200)

      expect(job).toHaveProperty('jobId')
      expect(job.requiredFields instanceof Array).toBe(true)
      expect(job.jobId).toEqual('job-1')
    })
    it('获取不存在的 Job', async () => {
      const {status, body: job} = await request(app)
        .get(`${jobListRoute}/job-99`)

      expect(status).toEqual(404)

      expect(job).not.toHaveProperty('jobId')
      expect(job).toHaveProperty('message')
      expect(job.message).toEqual('该内推职位不存在')
    })
  })

  describe('创建一个 Job 接口 => post /', () => {
    it('成功创建一个 Job', async () => {
      const jwtToken = generateJWT('user-3')
      const jobForm = {
        company: 'google',
        requiredFields: ['name', 'email', 'phone', 'experience'],
        deadline: dayjs().add(10, 'month').toDate(),
        expiration: 5,
        referTotal: 100,
        source: ''
      }

      const {status, body: job} = await request(app)
        .post(jobListRoute)
        .send(jobForm)
        .set('Authorization', jwtToken)

      expect(status).toEqual(200)
      Object.entries(jobForm).forEach(([key, value]) => {
        if (key === 'requiredFields') {
          return expect(job[key]).toStrictEqual(jobForm.requiredFields)
        }
        if (key === 'deadline') {
          return expect(job[key]).toEqual(jobForm.deadline.toISOString())
        }
        expect(job[key]).toEqual(value)
      })

      const dbUser = await UserModel.findByPk('user-3', {
        include: [JobModel]
      })

      expect(dbUser!.job).not.toBeNull()
      expect(dbUser!.job!.jobId).not.toBeUndefined()

      // 去掉新生成的 Job
      await JobModel.destroy({where: {jobId: dbUser!.job!.jobId}})
    })
    it('已经创建过 Job', async () => {
      const jwtToken = generateJWT('user-1')

      const {status, body} = await request(app)
        .post(jobListRoute)
        .send({})
        .set('Authorization', jwtToken)

      expect(status).toEqual(409)
      expect(body.message).toEqual('你已创建内推职位')
    })
  })

  describe('修改一个 Job 接口 => put /:jobId', () => {
    it('成功修改 Job', async () => {
      const jwtToken = generateJWT('user-1')
      const jobForm = {company: 'New Company',}

      const {status, body: job} = await request(app)
        .put(`${jobListRoute}/job-1`)
        .send(jobForm)
        .set('Authorization', jwtToken)

      expect(status).toEqual(200)
      expect(job.company).toEqual(jobForm.company)

      const dbJob1 = await JobModel.findByPk('job-1')
      expect(dbJob1).not.toBeNull()
      expect(dbJob1!.company).toEqual(jobForm.company)
    })
    it('修改不存在的 Job', async () => {
      const jwtToken = generateJWT('user-1')
      const jobForm = {company: 'New Company',}

      const {status, body} = await request(app)
        .put(`${jobListRoute}/job-99`)
        .send(jobForm)
        .set('Authorization', jwtToken)

      expect(status).toEqual(404)
      expect(body.message).toEqual('该内推职不存在')
    })
    it('无权限修改 Job', async () => {
      const jwtToken = generateJWT('user-1')
      const jobForm = {company: 'New Company',}

      const {status, body} = await request(app)
        .put(`${jobListRoute}/job-2`)
        .send(jobForm)
        .set('Authorization', jwtToken)

      expect(status).toEqual(403)
      expect(body.message).toEqual('无权限修改该内推职位')
    })
  })
})
