import express from 'express'
import {encryptPassword, generateJWT} from '@/utils/auth'
import passport from '@/plugins/passport'
import UserModel from '@/models/UserModel'
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

  const existedDbUser = await UserModel.findOne({
    where: {email}
  })

  if (existedDbUser) {
    res.status(409)
    return res.json({message: '该用户已存在'})
  }

  const dbUser = await UserModel.create({
    userId: uuidv4(),
    email,
    password: encryptPassword(password)
  })

  res.status(201)
  res.json(dbUser)
})

export default AuthRouter
