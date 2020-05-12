import path from 'path'
import db from '../../../models/db'
import {initMockDB, users} from '../../../mocks/dbObjects'
import {generateJWT} from '../../../utils/auth'
import request from 'supertest'
import app from '../../../app'
import {clearUploadDir, createUploadDir} from '../../../utils/upload'
import ResumeModel from '../../../models/ResumeModel'

const uploadResumeRoute = '/api/upload/resume'

const assetsPath = path.resolve(__dirname, '../../assets')

const [user1, user2] = users

const agent = request(app)

describe('UploadCtrlr', () => {
  beforeAll(async () => {
    await db.sync({force: true})
    await initMockDB()

    clearUploadDir()
    createUploadDir()
  })
  afterAll(async () => {
    await db.close()
    clearUploadDir()
  })

  describe('createResume', () => {
    it('成功上传简历', async () => {
      const jwtToken = generateJWT(user1.userId)
      const {status, body} = await agent
        .post(uploadResumeRoute)
        .attach('file', path.resolve(assetsPath, 'resume.pdf'))
        .set('Authorization', jwtToken)

      expect(status).toEqual(201)
      expect(body).toHaveProperty('resumeId')
      expect(body).toHaveProperty('url')
      expect(body).toHaveProperty('name')

      const dbResume = await ResumeModel.findByPk(body!.resumeId)
      expect(dbResume).not.toBeNull()
    })
    it('删除以前无用的简历', async () => {
      const jwtToken = generateJWT(user2.userId)
      const {status, body} = await agent
        .post(uploadResumeRoute)
        .attach('file', path.resolve(assetsPath, 'resume.pdf'))
        .set('Authorization', jwtToken)

      expect(status).toEqual(201)
      expect(body).toHaveProperty('resumeId')
      expect(body).toHaveProperty('url')
      expect(body).toHaveProperty('name')

      const dbResume = await ResumeModel.findByPk(body!.resumeId)
      expect(dbResume).not.toBeNull()

      const unusedCount = await ResumeModel.count({
        where: {referId: null, refereeId: user2.userId}
      })
      expect(unusedCount).toEqual(1)
    })
  })
})
