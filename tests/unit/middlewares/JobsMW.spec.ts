import db from '../../../models/db'
import {initMockDB, jobs, users} from '../../../mocks/dbObjects'
import request from 'supertest'
import app from '../../../app'
import {generateJWT} from '../../../utils/auth'

const jobListRoute = '/api/jobs'

const [user1] = users
const [expiredJob1, job1, job2] = jobs

const agent = request(app)

describe('JobsMW', () => {
  beforeAll(async () => {
    await db.sync({force: true})
    await initMockDB()
  })
  afterAll(async () => await db.close())

  describe('validJob', () => {
    it('修改不存在的 Job', async () => {
      const jwtToken = generateJWT(user1.userId)
      const jobForm = {company: 'New Company'}

      const {status, body} = await agent
        .put(`${jobListRoute}/job-99`)
        .send(jobForm)
        .set('Authorization', jwtToken)

      expect(status).toEqual(404)
      expect(body.message).toEqual('该职位不存在或已失效')
    })
    it('无权限修改 Job', async () => {
      const jwtToken = generateJWT(user1.userId)
      const jobForm = {company: 'New Company'}

      const {status, body} = await agent
        .put(`${jobListRoute}/${job2.jobId}`)
        .send(jobForm)
        .set('Authorization', jwtToken)

      expect(status).toEqual(403)
      expect(body.message).toEqual('无权限访问该职位')
    })
    it('expired 状态 Job', async () => {
      const jwtToken = generateJWT(user1.userId)
      const jobForm = {company: 'New Company'}

      const {status, body} = await agent
        .put(`${jobListRoute}/${expiredJob1.jobId}`)
        .send(jobForm)
        .set('Authorization', jwtToken)

      expect(status).toEqual(403)
      expect(body.message).toEqual('该职位已过期或申请满了')
    })
  })
})
