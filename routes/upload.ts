import express from 'express'
import {avatarMulter, resumeMulter} from '@/middleware/multer'
import UserModel from '@/models/UserModel'
import ResumeModel from '@/models/ResumeModel'
import {v4 as uuidv4} from 'uuid'

const UploadRouter = express.Router()

UploadRouter.post('/resume', resumeMulter.single('file'), async (req, res) => {
  const {filename} = req.file
  const {userId} = req.user as TJWTUser

  const dbUser = await UserModel.findByPk(userId)

  if (!dbUser) {
    res.status(404)
    return res.json({message: '该用户不存在'})
  }

  const dbResume = await ResumeModel.create({
    resumeId: uuidv4(),
    url: `${req.protocol}://${req.hostname}:4000/${userId}/resumes/${filename}`,
    name: filename,
    refereeId: userId
  })

  res.json(dbResume)
})

UploadRouter.post('/avatar', avatarMulter.single('file'), async (req, res,) => {
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
