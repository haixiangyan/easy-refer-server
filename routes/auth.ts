import express from 'express'
import {encryptPassword, generateJWT} from '@/utils/auth'
import passport from '@/plugins/passport'
import UserModel from '@/models/UserModel'
import JobModel from '@/models/JobModel'
import {v4 as uuidv4} from 'uuid'
import ReferModel from '@/models/ReferModel'
import ResumeModel from '@/models/ResumeModel'

// '/auth'
const AuthRouter = express.Router()

// 登录
AuthRouter.post('/login', (req, res) => {
  passport.authenticate('local', {session: false}, (err, user, info) => {
    if (err || !user) {
      return res.status(401).json({
        message: info.message
      })
    }

    req.login(user, {session: false}, (err) => {
      if (err) {
        res.status(500)
        return res.json({message: '登录时发生错误'})
      }

      const token = generateJWT(user.userId)

      return res.json({user, token})
    })
  })(req, res)
})

// 注册
AuthRouter.post('/register', async (req, res) => {
  const {email, password} = req.body

  const existedUserCount = await UserModel.count({
    where: {email}
  })

  if (existedUserCount !== 0) {
    res.status(403)
    return res.json({
      message: '该用户已存在'
    })
  }

  const user = await UserModel.create({
    userId: uuidv4(),
    email,
    password: encryptPassword(password)
  })

  res.json(user)
})

// 获取个人信息
AuthRouter.get('/user', passport.authenticate('jwt', {session: false}), async (req, res) => {
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
    job,
    resume: resumeList.length > 0 ? resumeList[0] : null,
  })
})

export default AuthRouter
