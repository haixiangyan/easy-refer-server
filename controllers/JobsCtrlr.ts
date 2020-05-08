import {Request, Response} from 'express'
import {TFullJob, TGetFullJob, TGetFullJobList, TGetJob, TLog} from '@/@types/jobs'
import JobModel from '../models/JobModel'
import {col, fn, Op} from 'sequelize'
import dayjs from 'dayjs'
import UserModel from '../models/UserModel'
import ReferModel from '../models/ReferModel'
import {DB_DATE_FORMAT} from '@/constants/format'
import {generateJobId} from '@/utils/auth'

class JobsCtrlr {
  public static async getJobList(req: Request, res: Response<TGetFullJobList>) {
    const page = parseInt(req.query.page as string)
    const limit = parseInt(req.query.limit as string)

    if (!page || !limit || page < 0 || limit < 1) {
      return res.status(422).json({message: '参数不正确'})
    }

    const {count: total, jobList} = await JobsCtrlr.parseJobList(page, limit)

    res.json({jobList, total})
  }

  public static async getJob(req: Request, res: Response<TGetFullJob>) {
    const {jobId} = req.params
    const {count, jobList} = await JobsCtrlr.parseJobList(1, 1, jobId)

    if (count === 0) {
      return res.status(404).json({message: '该内推职位不存在'})
    }

    res.json(jobList[0])
  }

  public static async createJob(req: Request, res: Response<TGetJob>) {
    const {userId} = req.user as TJWTUser
    const jobForm: JobModel = req.body

    // deadline 在今天之前
    if (dayjs(jobForm.deadline).isBefore(dayjs())) {
      return res.status(412).json({message: '截止日期应该在今天之后'})
    }

    const hasJob = await JobModel.findOne({
      where: {
        refererId: userId,
        deadline: {[Op.gte]: dayjs().toDate()}
      }
    })

    if (hasJob) {
      return res.status(409).json({message: '你已创建内推职位'})
    }

    const dbJob = await JobModel.create({
      ...jobForm,
      jobId: generateJobId(userId, new Date().getTime()),
      refererId: userId
    })

    return res.status(201).json(dbJob)
  }

  public static async editJob(req: Request, res: Response<TGetJob>) {
    const {userId} = req.user as TJWTUser
    const {jobId} = req.params
    const jobForm: JobModel = req.body

    const dbJob = await JobModel.findByPk(jobId, {
      include: [{model: UserModel, as: 'referer'}]
    })

    // 是否存在
    if (!dbJob) {
      return res.status(404).json({message: '该内推职不存在'})
    }

    // 是否有权访问该 Job
    if (!dbJob.referer || dbJob.referer.userId !== userId) {
      return res.status(403).json({message: '无权限修改该内推职位'})
    }

    await dbJob.update(jobForm)

    return res.json(dbJob)
  }

  public static async parseJobList(page = 1, limit = 10, jobId?: string) {
    const jobIdCondition = jobId ? {jobId} : {}

    // 获取所有 Job
    const {count, rows: dbJobList} = await JobModel.findAndCountAll({
      where: {
        ...jobIdCondition, // 是否需要用 jobId 过滤
        deadline: {[Op.gte]: dayjs().toDate()}, // 获取在 deadline 之前的内推职位
        appliedCount: {[Op.lt]: col('applyTotal')}
      } as any,
      include: [{model: UserModel, as: 'referer', attributes: ['name']}],
      offset: page - 1,
      limit,
      order: [['createdAt', 'DESC']]
    })

    // 将图表 Item 放入 JobItem 中
    const jobList = await Promise.all(dbJobList.map(async (dbJob) => {
      const job = dbJob.toJSON() as TFullJob
      return {
        ...job,
        logs: await JobsCtrlr.getLogs(job.jobId)
      } as TFullJob
    }))

    return {count, jobList}
  }

  /**
   * 获取 log
   */
  public static async getLogs(jobId: string): Promise<TLog[]> {
    // 获取内推图表的 Item
    const dbLogs = await ReferModel.findAll({
      attributes: [
        ['updatedOn', 'date'],
        [fn('COUNT', col('referId')), 'count'],
      ],
      where: {
        jobId,
        status: {[Op.not]: 'processing'}, // 已经 process 的数据
        updatedOn: {[Op.gte]: dayjs().subtract(10, 'day').toDate()} // 查 10 天内的数据
      },
      group: ['updatedOn'],
      order: [['updatedOn', 'DESC']]
    })

    // Pad
    return JobsCtrlr.padLogs(
      dbLogs.map(dbLog => dbLog.toJSON() as TLog)
    ).reverse()
  }

  /**
   * 补充处理图表数据，原始数据 新 -> 旧
   */
  public static padLogs(rawLogs: TLog[]): TLog[] {
    let logs: TLog[] = []
    let i = 0, j = 0
    const nowDay = dayjs()

    while (i < 10 || j < rawLogs.length) {
      const curtDay = nowDay.subtract(i, 'day')
      if (rawLogs[j] && dayjs(rawLogs[j].date).isSame(curtDay, 'day')) { // 如果有数据，则使用原来的数据
        logs.push(rawLogs[j])
        j += 1
      } else { // 不存在则补一个空数据
        logs.push({
          date: dayjs().subtract(i, 'day').format(DB_DATE_FORMAT),
          count: 0
        })
      }
      i += 1
    }

    return logs
  }
}

export default JobsCtrlr
