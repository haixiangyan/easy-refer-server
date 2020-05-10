import express from 'express'
import JobsCtrlr from '@/controllers/JobsCtrlr'
import JWTMW from '@/middlewares/JWTMW'
import JobsMW from '@/middlewares/JobsMW'

// '/jobs'
const JobsRouter = express.Router()

// 获取 Job List
JobsRouter.get('/', JobsCtrlr.getJobList)

// 获取一个 Job
JobsRouter.get('/:jobId', JobsCtrlr.getJob)

// 创建一个 Job
JobsRouter.post(
  '/',
  JWTMW.authenticate,
  JobsCtrlr.createJob
)

// 修改一个 Job
JobsRouter.put(
  '/:jobId',
  JWTMW.authenticate,
  JobsMW.validJob,
  JobsCtrlr.editJob
)

// 删除一个 Job
JobsRouter.delete(
  '/:jobId',
  JWTMW.authenticate,
  JobsMW.validJob,
  JobsCtrlr.deleteJob
)

export default JobsRouter
