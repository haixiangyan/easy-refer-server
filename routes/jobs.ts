import express from 'express'
import JobModel from '@/models/JobModel'
import UserModel from '@/models/UserModel'
import {col, fn, Op} from 'sequelize'
import ReferModel from '@/models/ReferModel'
import dayjs from 'dayjs'
import {extractField} from '@/utils/tool'
import {v4 as uuidv4} from 'uuid'
import passport from '@/plugins/passport'

// '/jobs'
const JobsRouter = express.Router()

// 获取 Job item list
JobsRouter.get('/items', async (req, res) => {
  const page = parseInt(req.query.page as string)
  const limit = parseInt(req.query.limit as string)

  if (!page || !limit) {
    res.status(422)
    return res.json({message: '缺少参数'})
  }

  const {count: total, jobItemList} = await getJobItemList(page, limit)

  res.json({jobItemList, total})
})

// 获取一个 Job item
JobsRouter.get('/items/:jobId', async (req, res) => {
  const {jobId} = req.params
  const {count, jobItemList} = await getJobItemList(1, 1, jobId)

  if (count === 0) {
    res.status(404)
    return res.json({message: '该内推职位不存在'})
  }

  res.json(jobItemList[0])
})

// 获取一个 Job
JobsRouter.get('/:jobId', async (req, res) => {
  const {jobId} = req.params

  const dbJob = await JobModel.findOne({
    where: {
      jobId,
      deadline: {[Op.gte]: dayjs().toDate()}
    }
  })

  if (!dbJob) {
    res.status(404)
    return res.json({message: '该内推职位不存在'})
  }

  res.json(dbJob)
})

// 创建一个 Job
JobsRouter.post('/', passport.authenticate('jwt', {session: false}), async (req, res) => {
  const {userId} = req.user as TJWTUser
  const jobForm: TJobForm = req.body

  // deadline 在今天之前
  if (dayjs(jobForm.deadline).isBefore(dayjs())) {
    res.status(412)
    return res.json({message: '截止日期应该在今天之后'})
  }

  const hasJob = await JobModel.findOne({
    where: {
      refererId: userId,
      deadline: {[Op.gte]: dayjs().toDate()}
    }
  })

  if (hasJob) {
    res.status(409)
    return res.json({message: '你已创建内推职位'})
  }

  const dbJob = await JobModel.create({
    ...jobForm,
    jobId: uuidv4(),
    refererId: userId
  })

  res.json(dbJob)
})

// 修改一个 Job
JobsRouter.put('/:jobId', passport.authenticate('jwt', {session: false}), async (req, res) => {
  const {userId} = req.user as TJWTUser
  const {jobId} = req.params
  const jobForm: TJobForm = req.body

  const dbJob = await JobModel.findByPk(jobId, {
    include: [{model: UserModel, as: 'referer'}]
  })

  // 是否存在
  if (!dbJob) {
    res.status(404)
    return res.json({message: '该内推职不存在'})
  }

  // 是否有权访问该 Job
  if (!dbJob.referer || dbJob.referer.userId !== userId) {
    res.status(403)
    return res.json({message: '无权限修改该内推职位'})
  }

  await dbJob.update(jobForm)

  res.json(dbJob)
})

const getJobItemList = async (page = 1, limit = 10, jobId?: string) => {
  const jobIdCondition = jobId ? {jobId} : {}

  // 获取所有 Job
  const {count, rows: dbJobItemList} = await JobModel.findAndCountAll({
    where: {
      ...jobIdCondition, // 是否需要用 jobId 过滤
      deadline: {[Op.gte]: dayjs().toDate()} // 获取在 deadline 之前的内推职位
    } as any,
    include: [{model: UserModel, as: 'referer', attributes: ['name', 'avatarUrl']}],
    offset: page - 1,
    limit,
    order: [['createdAt', 'DESC']]
  })

  // 获取所有 Id
  const jobIds = dbJobItemList.map(jobItem => jobItem.jobId)

  // 获取已内推数目
  const dbReferredCount = await ReferModel.findAll({
    attributes: [
      'jobId',
      [fn('COUNT', col('referId')), 'referredCount'],
    ],
    where: {
      jobId: {[Op.in]: jobIds},
      status: {[Op.not]: 'approved'}, // 已经 approve 的数据
    },
    group: ['jobId']
  })

  // 获取内推图表的 Item
  const dbChartItemList = await ReferModel.findAll({
    attributes: [
      'jobId',
      ['updatedOn', 'date'],
      [fn('COUNT', col('referId')), 'count'],
    ],
    where: {
      jobId: {[Op.in]: jobIds},
      status: {[Op.not]: 'processing'}, // 已经 process 的数据
      updatedOn: {[Op.gte]: dayjs().subtract(12, 'month').toDate()} // 查 12 个月内的数据
    },
    group: ['jobId', 'updatedOn']
  })

  // 提取 jobId，将数组变成对象
  const chartItemObject = extractField(dbChartItemList.map(i => i.toJSON()), 'jobId')

  // 将图表 Item 放入 JobItem 中
  const jobItemList = dbJobItemList.map(dbJobItem => {
    const {jobId} = dbJobItem
    const countItem = dbReferredCount.find(i => i.jobId === jobId)
    const referredCount = countItem ? (countItem.toJSON() as any).referredCount : 0

    return {
      ...dbJobItem.toJSON(),
      referredCount,
      processedChart: dbJobItem.jobId in chartItemObject ? chartItemObject[dbJobItem.jobId] : [],
    }
  })

  return {count, jobItemList}
}

export default JobsRouter
