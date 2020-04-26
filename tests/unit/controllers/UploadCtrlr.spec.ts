import path from 'path'
import fs from 'fs'
import db from '../../../models/db'
import {initMockDB, users} from '../../../mocks/dbObjects'
import {generateJWT} from '../../../utils/auth'
import request from 'supertest'
import app from '../../../app'
import {clearUploadDir, createUploadDir, getUploadAssetsPath} from '../../../utils/upload'
import ResumeModel from '../../../models/ResumeModel'

const uploadAvatarRoute = '/api/upload/avatar'
const uploadResumeRoute = '/api/upload/resume'

const assetsPath = path.resolve(__dirname, '../../assets')

const [user1, user2, user3] = users

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

  describe('createAvatar', () => {
    it('成功上传一张头像', async () => {
      const jwtToken = generateJWT(user2.userId)
      const {status, body} = await agent
        .post(uploadAvatarRoute)
        .attach('file', path.resolve(assetsPath, 'avatar.jpg'))
        .set('Authorization', jwtToken)

      expect(status).toEqual(201)
      expect(body).toHaveProperty('avatarUrl')

      // 获取文件系统中的头像
      const avatarFileName = fs.readdirSync(getUploadAssetsPath(user2.userId, 'avatar'))[0]
      expect(/avatar-[\d]*.jpg/.test(avatarFileName)).toEqual(true)
    })
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
  })
})
