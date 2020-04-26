import express from 'express'
import UploadCtrlr from '@/controllers/UploadCtrlr'
import UsersCtrlr from '@/controllers/UsersCtrlr'

const UploadRouter = express.Router()

UploadRouter.post('/resume', UploadCtrlr.uploadResume, UsersCtrlr.createResume)

UploadRouter.post('/avatar', UploadCtrlr.uploadAvatar, UsersCtrlr.createAvatar)

export default UploadRouter
