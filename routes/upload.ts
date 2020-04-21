import express from 'express'
import Mock from 'mockjs'
import {avatarMulter} from '@/middleware/multer'
import UserModel from '@/models/UserModel'

const UploadRouter = express.Router()

UploadRouter.post('/resume', (req, res) => {
  res.json(Mock.mock({
    resumeId: '@ID',
    url: '@URL',
    name: '@URL',
  }))
})

UploadRouter.post('/avatar', avatarMulter.single('file'), async (req, res) => {
  const {filename} = req.file
  const {userId} = req.user as TJWTUser

  const dbUser = await UserModel.findByPk(userId)

  if (!dbUser) {
    res.status(404)
    return res.json({message: '该用户不存在'})
  }

  dbUser.avatarUrl = `${req.protocol}://${req.hostname}:4000/${userId}/avatar/${filename}`

  await dbUser.save()

  res.json({avatarUrl: dbUser.avatarUrl})
})

export default UploadRouter
