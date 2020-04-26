import express from 'express'
import AuthCtrlr from '@/controllers/AuthCtrlr'
import JWTMW from '@/middlewares/JWTMW'

// '/auth'
const AuthRouter = express.Router()

// 登录
AuthRouter.post('/login', AuthCtrlr.login)

// 获取更新的 token
AuthRouter.post('/refresh', JWTMW.authenticate, AuthCtrlr.refresh)

// 激活账号
AuthRouter.post('/activate', AuthCtrlr.activate)

// 注册
AuthRouter.post('/register', AuthCtrlr.register)

export default AuthRouter
