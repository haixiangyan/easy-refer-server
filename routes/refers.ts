import express from 'express'
import Mock from 'mockjs'
import {MyRefer, OtherRefer, Refer} from '@/mocks/objects'
import ReferModel from '@/models/ReferModel'
import ResumeModel from '@/models/ResumeModel'

// '/refers'
const RefersRouter = express.Router()

// 获取 My Refer / Other Refer
RefersRouter.get('/', (req, res) => {
  const referTemplate = req.url.includes('my') ? MyRefer : OtherRefer
  res.json(Mock.mock({
    'referList|10': [referTemplate],
    totalPages: 100
  }))
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
    return res.json ({message: '无权限访问该内推'})
  }

  res.json(dbRefer)
})

// 创建 Refer
RefersRouter.post('/', (req, res) => {
  res.json(Mock.mock(Refer))
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
