import express from 'express'
import JobsCtrlr from '@/controllers/JobsCtrlr'
import jwtMW from '@/middlewares/passport-jwt'

// '/jobs'
const JobsRouter = express.Router()

// 获取 Job item list
JobsRouter.get('/items', JobsCtrlr.getJobItemList)

// 获取一个 Job item
JobsRouter.get('/items/:jobId', JobsCtrlr.getJobItem)

// 获取一个 Job
JobsRouter.get('/:jobId', JobsCtrlr.getJob)

// 创建一个 Job
JobsRouter.post('/', jwtMW, JobsCtrlr.createJob)

// 修改一个 Job
JobsRouter.put('/:jobId', jwtMW, JobsCtrlr.editJob)

export default JobsRouter
