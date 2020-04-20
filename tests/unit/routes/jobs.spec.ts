import db from '../../../models/db'
import {initMockDB} from '../../../mocks/dbObjects'
import request from 'supertest'
import app from '../../../app'

const getJobItemListRoute = '/api/jobs/item'

describe('/jobs', () => {
  beforeAll(async () => {
    await db.sync({force: true})
    await initMockDB()
  })
  afterAll(async () => await db.close())

  describe('get /item', () => {
    it('成功获取 Job Item List', async () => {
      const {status, body} = await request(app)
        .get(getJobItemListRoute)
        .query({page: 1, limit: 10})

      const {jobItemList, totalPages} = body

      expect(status).toEqual(200)
      expect(jobItemList.length).toBeLessThanOrEqual(10)
      expect(totalPages).toEqual(1)

      expect(jobItemList[0]).toHaveProperty('finishedChart')
      expect(jobItemList[0].finishedChart).not.toBeNull()
    })
    it('传错 page 和 limit 参数', async () => {
      const {status, body} = await request(app)
        .get(getJobItemListRoute)

      expect(status).toEqual(422)
      expect(body.message).toEqual('缺少 page 或者 limit 参数')
    })
  })

  describe('get /item/:jobId', () => {
    it('成功获取 Job Item', async () => {
      const {status, body: jobItem} = await request(app)
        .get(`${getJobItemListRoute}/job-1`)

      expect(status).toEqual(200)
      expect(jobItem).toHaveProperty('finishedChart')
      expect(jobItem.finishedChart).not.toBeNull()
    })
    it ('不存在 Job', async () => {
      const {status, body} = await request(app)
        .get(`${getJobItemListRoute}/job-99`)

      expect(status).toEqual(404)
      expect(body.message).toEqual('该内推职位不存在')
    })
  })
})
