import express from 'express'
import Mock from 'mockjs'
import {User} from '@/mocks/objects'
import {generateJWT} from '@/utils/auth'
import passport from '@/plugins/passport'
import UserModel from '@/models/UserModel'
import JobModel from '@/models/JobModel'
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
      if (err) res.send(err)

      const token = generateJWT(user.userId)

      return res.json({user, token})
    })
  })(req, res)
})

// 注册
AuthRouter.post('/register', (req, res) => {
  res.json(Mock.mock(User))
})

// 获取个人信息
AuthRouter.get('/user', passport.authenticate('jwt', {session: false}), async (req, res) => {
  const {userId} = req.user as TJwtRequest

  const user = await UserModel.findByPk(userId, {
    include: [JobModel, ResumeModel]
  })

  if (!user) throw new Error('该用户不存在')

  res.json(user)
})

export default AuthRouter
