import express from 'express'
import Mock from 'mockjs'
import {Job} from '@/mocks/objects'
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
JobsRouter.get('/item', async (req, res) => {
  const page = parseInt(req.query.page as string)
  const limit = parseInt(req.query.limit as string)

  if (!page || !limit) {
    res.status(422)
    return res.json({message: '缺少 page 或者 limit 参数'})
  }

  const {count, jobItemList} = await getJobItemList(page, limit)

  res.json({
    jobItemList,
    totalPages: Math.ceil(count / limit)
  })
})

// 获取一个 Job item
JobsRouter.get('/item/:jobId', async (req, res) => {
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

  const dbJob = await JobModel.findByPk(jobId)

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

  const hasJob = await JobModel.findOne({
    where: {refererId: userId}
  })

  if (hasJob) {
    res.status(403)
    return res.json({message: '你已创建内推职位'})
  }

  const dbJob = await JobModel.create({
    ...jobForm,
    jobId: uuidv4(),
    refererId: userId,
    requiredFields: jobForm.requiredFields.join(',')
  })

  res.json(dbJob)
})

// 修改一个 Job
JobsRouter.put('/:jobId', (req, res) => {
  res.json(Mock.mock(Job))
})

const getJobItemList = async (page = 1, limit = 10, jobId?: string) => {
  const jobIdCondition = jobId ? {jobId} : {}

  // 获取所有 Job
  const {count, rows: dbJobItemList} = await JobModel.findAndCountAll({
    where: {...jobIdCondition} as any,
    include: [{model: UserModel, as: 'referer', attributes: ['name', 'avatarUrl']}],
    offset: page - 1,
    limit
  })

  // 获取内推图表的 Item
  const dbChartItemList = await ReferModel.findAll({
    attributes: [
      'jobId',
      ['updatedOn', 'date'],
      [fn('COUNT', col('referId')), 'count'],
    ],
    where: {
      ...jobIdCondition as {},
      status: {[Op.eq]: 'processing'}, // 已经 process 的数据
      updatedOn: {[Op.gte]: dayjs().subtract(12, 'month').toDate()} // 查 12 个月内的数据
    },
    group: ['refererId', 'jobId', 'updatedOn']
  })

  // 提取 jobId，将数组变成对象
  const chartItemObject = extractField(dbChartItemList.map(i => i.toJSON()), 'jobId')

  // 将图表 Item 放入 JobItem 中
  const jobItemList = dbJobItemList.map(dbJobItem => ({
    ...dbJobItem.toJSON(),
    finishedChart: chartItemObject[dbJobItem.jobId]
  }))

  return {count, jobItemList}
}

export default JobsRouter
