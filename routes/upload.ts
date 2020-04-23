import express from 'express'
import UploadCtrlr from '@/controllers/UploadCtrlr'

const UploadRouter = express.Router()

UploadRouter.post('/resume', UploadCtrlr.uploadResume, UploadCtrlr.createResume)

UploadRouter.post('/avatar', UploadCtrlr.uploadAvatar, UploadCtrlr.createAvatar)

export default UploadRouter
