import db from '../../../models/db'
import {initMockDB, jobs, users} from '../../../mocks/dbObjects'
import request from 'supertest'
import app from '../../../app'
import {generateJWT} from '../../../utils/auth'
import JobModel from '../../../models/JobModel'
import {DB_DATE_FORMAT} from '../../../constants/format'
import JobsCtrlr from '../../../controllers/JobsCtrlr'
import {TLog} from '../../../@types/jobs'
import dayjs = require('dayjs')

const jobListRoute = '/api/jobs'

const [user1, user2, user3] = users
const [expiredJob1, job1] = jobs

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

      expect(jobList[0]).toHaveProperty('appliedCount')
      expect(jobList[0]).toHaveProperty('logs')
      expect(jobList[0].logs).not.toBeNull()
      expect(jobList[0].logs.length).toEqual(10)
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
      expect(job).toHaveProperty('appliedCount')
      expect(job).toHaveProperty('logs')
      expect(job.logs).not.toBeNull()
      expect(job.logs.length).toEqual(10)
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
        applyTotal: 100,
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
          return expect(job[key]).toEqual(dayjs(jobForm.deadline).format(DB_DATE_FORMAT))
        }
        expect(job[key]).toEqual(value)
      })

      // 去掉新生成的 Job
      await JobModel.destroy({where: {jobId: job!.jobId}})
    })
    it('已经创建过 Job', async () => {
      const jobForm = {
        company: 'google',
        requiredFields: ['name', 'email', 'phone', 'experience'],
        deadline: dayjs().add(10, 'month').toISOString(),
        autoRejectDay: 5,
        applyTotal: 100,
        source: ''
      }
      const jwtToken = generateJWT(user1.userId)

      const {status, body} = await agent
        .post(jobListRoute)
        .send(jobForm)
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
        applyTotal: 100,
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
      expect(body.message).toEqual('该内推职位不存在')
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

  describe('padChartItem', () => {
    it('成功补全数据', () => {
      const nowDay = dayjs()
      const list = [
        {date: nowDay.format(DB_DATE_FORMAT), count: 2},
        {date: nowDay.subtract(4, 'day').format(DB_DATE_FORMAT), count: 4},
        {date: nowDay.subtract(5, 'day').format(DB_DATE_FORMAT), count: 7},
      ]

      const newList = JobsCtrlr.padLogs(list)

      expect(newList.length).toEqual(10)
      // 原来数据存在
      expect(newList[0]).toStrictEqual(list[0])
      // 补充新数据
      expect(newList[1]).toStrictEqual({
        date: nowDay.subtract(1, 'day').format(DB_DATE_FORMAT),
        count: 0
      })
      expect(newList[newList.length - 1]).toStrictEqual({
        date: nowDay.subtract(9, 'day').format(DB_DATE_FORMAT),
        count: 0
      })
    })
    it('补全所有数据', () => {
      const list: TLog[] = []

      const newList = JobsCtrlr.padLogs(list)

      expect(newList.length).toEqual(10)
      expect(newList[0]).toStrictEqual({
        date: dayjs().format(DB_DATE_FORMAT),
        count: 0
      })
      expect(newList[newList.length - 1]).toStrictEqual(newList[newList.length - 1])
    })
    it('当数据存在时，不需要补全', () => {
      const list: TLog[] = []
      for (let i = 0; i < 10; i++) {
        list.push({
          date: dayjs().subtract(i, 'day').format(DB_DATE_FORMAT),
          count: 4
        })
      }

      const newList = JobsCtrlr.padLogs(list)

      expect(newList.length).toEqual(10)
      expect(newList[0]).toStrictEqual(list[0])
      expect(newList[newList.length - 1]).toStrictEqual(list[list.length - 1])
    })
  })

  describe('deleteJob', () => {
    it('成功删除 Job', async () => {
      const jwtToken = generateJWT(user1.userId)
      const {status} = await agent
        .delete(`${jobListRoute}/${job1.jobId}`)
        .set('Authorization', jwtToken)

      const dbJob = await JobModel.findByPk(job1.jobId)

      expect(status).toEqual(200)
      expect(dbJob).toBeNull()
    })
  })
})
