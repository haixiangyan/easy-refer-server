import express from 'express'
import Mock from 'mockjs'
import {Job, Resume, User} from '@/mocks/objects'
import {generateJWT} from '@/utils/auth'
import passport from '@/plugins/passport'

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
AuthRouter.get('/user', (req, res) => {
  res.json(Mock.mock({
    info: User,
    job: Job,
    resume: Resume
  }))
})

export default AuthRouter
