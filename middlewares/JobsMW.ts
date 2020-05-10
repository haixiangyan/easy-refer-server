import {NextFunction, Request, Response} from 'express'
import JobModel from '@/models/JobModel'
import {JOB_STATES} from '@/constants/status'

class JobsMW {
  // 判断 Job 是否合法
  public static async validJob(req: Request, res: Response, next: NextFunction) {
    const {userId} = req.user as TJWTUser
    const {jobId} = req.params

    const dbJob = await JobModel.findByPk(jobId)

    // 判断是否存在
    if (!dbJob) {
      return res.status(404).json({message: '该职位不存在或已失效'})
    }

    // 判断是否属于该 user
    if (dbJob.refererId !== userId) {
      return res.status(403).json({message: '无权限访问该职位'})
    }

    // 判断是否 active
    if (dbJob.status !== JOB_STATES.active) {
      return res.status(403).json({message: '该职位已过期或申请满了'})
    }

    // 传递 roleId
    res.locals.dbJob = dbJob

    next(false)
  }
}

export default JobsMW
