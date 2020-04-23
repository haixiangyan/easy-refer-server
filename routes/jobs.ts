import express from 'express'
import JobsCtrlr from '@/controllers/JobsCtrlr'
import JWTMW from '@/middlewares/JWTMW'

// '/jobs'
const JobsRouter = express.Router()

// 获取 Job List
JobsRouter.get('/', JobsCtrlr.getJobList)

// 获取一个 Job
JobsRouter.get('/:jobId', JobsCtrlr.getJob)

// 创建一个 Job
JobsRouter.post('/', JWTMW.authenticate, JobsCtrlr.createJob)

// 修改一个 Job
JobsRouter.put('/:jobId', JWTMW.authenticate, JobsCtrlr.editJob)

export default JobsRouter
