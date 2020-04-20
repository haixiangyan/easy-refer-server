import express from 'express'
import Mock from 'mockjs'
import {Job, JobItem} from '@/mocks/objects'
import JobModel from '@/models/JobModel'
import UserModel from '@/models/UserModel'
import {col, fn, Op} from 'sequelize'
import ReferModel from '@/models/ReferModel'
import dayjs from 'dayjs'
import {extractField} from '@/utils/tool'

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

  const {count, rows: dbJobItemList} = await JobModel.findAndCountAll({
    include: [{model: UserModel, as: 'referer', attributes: ['name', 'avatarUrl']}],
    offset: page - 1,
    limit
  })

  const dbChartItemList = await ReferModel.findAll({
    attributes: [
      'jobId',
      ['updatedOn', 'date'],
      [fn('COUNT', col('referId')), 'count'],
    ],
    where: {
      status: {[Op.eq]: 'processing'}, // 已经 process 的数据
      updatedOn: {[Op.gte]: dayjs().subtract(12, 'month').toDate()} // 查 12 个月内的数据
    },
    group: ['refererId', 'jobId', 'updatedOn']
  })

  const chartItemObject = extractField(dbChartItemList.map(i => i.toJSON()), 'jobId')

  const jobItemList = dbJobItemList.map(dbJobItem => ({
    ...dbJobItem.toJSON(),
    finishedChart: chartItemObject[dbJobItem.jobId]
  }))

  res.json({
    jobItemList,
    totalPages: Math.ceil(count / limit)
  })
})

// 获取一个 Job item
JobsRouter.get('/item/:jobId', (req, res) => {
  res.json(Mock.mock(JobItem))
})

// 获取一个 Job
JobsRouter.get('/:jobId', (req, res) => {
  res.json(Mock.mock(Job))
})

// 创建一个 Job
JobsRouter.post('/', (req, res) => {
  res.json(Mock.mock(Job))
})

// 修改一个 Job
JobsRouter.put('/:jobId', (req, res) => {
  res.json(Mock.mock(Job))
})

export default JobsRouter
