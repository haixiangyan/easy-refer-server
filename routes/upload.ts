import express from 'express'
import UploadCtrlr from '@/controllers/UploadCtrlr'
import UsersCtrlr from '@/controllers/UsersCtrlr'

const UploadRouter = express.Router()

UploadRouter.post('/resume', UploadCtrlr.uploadResume, UsersCtrlr.createResume)

export default UploadRouter
