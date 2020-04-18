import express from 'express'
import {generateJWT} from '@/utils/auth'
import passport from '@/plugins/passport'
import UserModel from '@/models/UserModel'
import JobModel from '@/models/JobModel'
import ResumeModel from '@/models/ResumeModel'
import {v4 as uuidv4} from 'uuid'

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

  const userId = uuidv4()
  // TODO: 需要加密密码
  const encryptedPassword = password

  const user = await UserModel.create({
    userId, email, password: encryptedPassword
  })

  res.json(user)
})

// 获取个人信息
AuthRouter.get('/user', passport.authenticate('jwt', {session: false}), async (req, res) => {
  const {userId} = req.user as TJwtRequest

  const user = await UserModel.findByPk(userId, {
    include: [JobModel, ResumeModel]
  })

  if (!user) {
    res.status(404)
    res.json({message: '该用户不存在'})
  } else {
    res.json(user)
  }
})

export default AuthRouter
