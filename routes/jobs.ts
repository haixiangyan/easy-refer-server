import express from 'express'
import JobsController from '@/controllers/JobsController'
import jwtMW from '@/middlewares/passport-jwt'

// '/jobs'
const JobsRouter = express.Router()

// 获取 Job item list
JobsRouter.get('/items', JobsController.getJobItemList)

// 获取一个 Job item
JobsRouter.get('/items/:jobId', JobsController.getJobItem)

// 获取一个 Job
JobsRouter.get('/:jobId', JobsController.getJob)

// 创建一个 Job
JobsRouter.post('/', jwtMW, JobsController.createJob)

// 修改一个 Job
JobsRouter.put('/:jobId', jwtMW, JobsController.editJob)

export default JobsRouter
