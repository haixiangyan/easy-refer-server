import express from 'express'
import ReferModel from '@/models/ReferModel'
import ResumeModel from '@/models/ResumeModel'
import JobModel from '@/models/JobModel'
import {v4 as uuidv4} from 'uuid'
import dayjs from 'dayjs'
import {Op} from 'sequelize'
import UserModel from '@/models/UserModel'

// '/refers'
const RefersRouter = express.Router()

// 获取 My Refer / Other Refer
RefersRouter.get('/', async (req, res) => {
  const role = req.query.role as string
  const {userId} = req.user as TJWTUser
  const page = parseInt(req.query.page as string)
  const limit = parseInt(req.query.limit as string)

  if (!role || !page || !limit) {
    res.status(422)
    return res.json({message: '缺少参数'})
  }

  const whereClause: {[key: string]: any} = {
    my: {refereeId: userId},
    other: {refererId: userId}
  }

  const {count: total, rows: referList} = await ReferModel.findAndCountAll({
    offset: page - 1,
    limit,
    order: [['createdAt', 'DESC']],
    include: [
      ResumeModel, JobModel,
      {model: UserModel, as: 'referer'},
      {model: UserModel, as: 'referee'}
    ],
    where: {...whereClause[role]}
  })

  res.json({referList: referList, total})
})

// 获取一个 Refer
RefersRouter.get('/:referId', async (req, res) => {
  const {userId} = req.user as TJWTUser
  const {referId} = req.params

  const dbRefer = await ReferModel.findByPk(referId)

  if (!dbRefer) {
    res.status(404)
    return res.json({message: '该内推不存在'})
  }

  // Refer 不属性该用户，且 Refer 不能被别的 Referer 看到
  if (dbRefer.refereeId !== userId && dbRefer.refererId !== userId) {
    res.status(403)
    return res.json({message: '无权限访问该内推'})
  }

  res.json(dbRefer)
})

// 创建 Refer
RefersRouter.post('/:jobId', async (req, res) => {
  const {userId} = req.user as TJWTUser
  const {jobId} = req.params
  const referForm = req.body

  const dbJob = await JobModel.findByPk(jobId, {
    include: [{
      model: ReferModel, as: 'referList', where: {
        // 重复申请或者自己创建的内推职位
        [Op.or]: [{refereeId: userId}, {refererId: userId}]
      },
      separate: true // 分开查询非法申请的 SQL
    }]
  })

  if (!dbJob) {
    res.status(404)
    return res.json({message: '该内推职位不存在'})
  }

  // 重复申请或者自己创建的内推职位
  if (dbJob.referList && dbJob.referList.length > 0) {
    res.status(403)
    return res.json({message: '你已申请该内推职位或这是你创建的内推职位'})
  }

  const dbRefer = await ReferModel.create({
    ...referForm,
    referId: uuidv4(),
    jobId,
    refereeId: userId,
    refererId: dbJob.refererId,
    status: 'processing',
    updatedOn: dayjs().toDate()
  })

  res.json(dbRefer)
})

// 部分修改 Refer
RefersRouter.patch('/:referId', async (req, res) => {
  const {userId} = req.user as TJWTUser
  const {referId} = req.params
  const patchReferForm = req.body

  const dbRefer = await ReferModel.findByPk(referId)

  if (!dbRefer) {
    res.status(404)
    return res.json({message: '该内推不存在'})
  }

  if (dbRefer.refereeId !== userId) {
    res.status(403)
    return res.json({message: '无权限访问该内推'})
  }

  Object.entries(patchReferForm).forEach(([key, value]) => {
    dbRefer[key] = value
  })
  dbRefer.updatedOn = dayjs().toDate()

  await dbRefer.save()

  res.json(dbRefer)
})

// 删除 Refer
RefersRouter.delete('/:referId', async (req, res) => {
  const {userId} = req.user as TJWTUser
  const {referId} = req.params

  const dbRefer = await ReferModel.findByPk(referId, {
    include: [ResumeModel]
  })

  if (!dbRefer) {
    res.status(404)
    return res.json({message: '该内推不存在'})
  }

  if (dbRefer.refereeId !== userId) {
    res.status(403)
    return res.json({message: '无权限访问该内推'})
  }

  if (dbRefer.resume) {
    await dbRefer.resume.destroy()
  }

  await dbRefer.destroy()

  res.json()
})

export default RefersRouter
