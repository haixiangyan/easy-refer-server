import express from 'express'
import UserModel from '@/models/UserModel'
import JobModel from '@/models/JobModel'
import ResumeModel from '@/models/ResumeModel'
import ReferModel from '@/models/ReferModel'

// '/users'
const UsersRouter = express.Router()

// 修改 User
UsersRouter.put('/', async (req, res) => {
  const {userId} = req.user as TJWTUser
  const userForm: TUserForm = req.body

  const updatedUser = await UserModel.findByPk(userId)

  if (!updatedUser) {
    res.status(404)
    return res.json({
      message: '用户不存在'
    })
  }

  Object.entries(userForm).forEach(([key, value]) => {
    updatedUser[key] = value
  })

  await updatedUser.save()

  res.json(updatedUser)
})

// 获取个人信息
UsersRouter.get('/', async (req, res) => {
  const {userId} = req.user as TJWTUser

  const user = await UserModel.findByPk(userId, {
    include: [JobModel, {
      model: ResumeModel,
      as: 'resumeList',
      limit: 1,
      order: [['createdAt', 'DESC']]
    }],
  })

  if (!user) {
    res.status(404)
    return res.json({message: '该用户不存在'})
  }

  // 统计已处理自己的 refer
  const myReferTotal = await ReferModel.count({
    where: {refereeId: userId}
  })
  const approvedMyReferCount = await ReferModel.count({
    where: {refereeId: userId, status: 'approved'}
  })
  const otherReferTotal = await ReferModel.count({
    where: {refererId: userId}
  })
  const approvedOtherReferCount = await ReferModel.count({
    where: {refererId: userId, status: 'approved'}
  })

  const {job, resumeList, ...userInfo}: any = user.toJSON()
  const info: TUser = {
    ...userInfo,
    myReferTotal,
    approvedMyReferCount,
    otherReferTotal,
    approvedOtherReferCount
  }

  res.json({
    info,
    job: {
      ...job,
      requiredFields: job.requiredFields.split(',')
    },
    resume: resumeList.length > 0 ? resumeList[0] : null,
  })
})

export default UsersRouter
