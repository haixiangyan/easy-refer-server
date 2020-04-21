import path from 'path'
import fs from 'fs'
import db from '../../../models/db'
import {initMockDB} from '../../../mocks/dbObjects'
import {generateJWT} from '../../../utils/auth'
import request from 'supertest'
import app from '../../../app'
import {clearUploadDir, createUploadDir, getUploadAssetsPath} from '../../../utils/upload'
import ResumeModel from '../../../models/ResumeModel'

const uploadAvatarRoute = '/api/upload/avatar'
const uploadResumeRoute = '/api/upload/resume'

const assetsPath = path.resolve(__dirname, '../../assets')

describe('/upload', () => {
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

  describe('post /avatar', () => {
    it('成功上传一张头像', async () => {
      const jwtToken = generateJWT('user-2')
      const {status, body} = await request(app)
        .post(uploadAvatarRoute)
        .attach('file', path.resolve(assetsPath, 'avatar.jpg'))
        .set('Authorization', jwtToken)

      expect(status).toEqual(200)
      expect(body).toHaveProperty('avatarUrl')

      // 获取文件系统中的头像
      const avatarFileName = fs.readdirSync(getUploadAssetsPath('user-2', 'avatar'))[0]
      expect(/avatar-[\d]*.jpg/.test(avatarFileName)).toEqual(true)
    })
    it('非法用户上传头像', async () => {
      const jwtToken = generateJWT('user-99')
      const {status, body} = await request(app)
        .post(uploadAvatarRoute)
        .attach('file', path.resolve(assetsPath, 'avatar.jpg'))
        .set('Authorization', jwtToken)

      expect(status).toEqual(404)
      expect(body.message).toEqual('该用户不存在')
    })
  })

  describe('post /resume', () => {
    it('成功上传简历', async () => {
      const jwtToken = generateJWT('user-1')
      const {status, body} = await request(app)
        .post(uploadResumeRoute)
        .attach('file', path.resolve(assetsPath, 'resume.pdf'))
        .set('Authorization', jwtToken)

      expect(status).toEqual(200)
      expect(body).toHaveProperty('resumeId')
      expect(body).toHaveProperty('url')
      expect(body).toHaveProperty('name')

      const dbResume = await ResumeModel.findByPk(body!.resumeId)
      expect(dbResume).not.toBeNull()
    })
    it('非法用户上传简历', async () => {
      const jwtToken = generateJWT('user-99')
      const {status, body} = await request(app)
        .post(uploadResumeRoute)
        .attach('file', path.resolve(assetsPath, 'resume.pdf'))
        .set('Authorization', jwtToken)

      expect(status).toEqual(404)
      expect(body.message).toEqual('该用户不存在')
    })
  })
})
