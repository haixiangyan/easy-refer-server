import express from 'express'
import UsersCtrlr from '@/controllers/UsersCtrlr'

// '/users'
const UsersRouter = express.Router()

// 获取个人信息
UsersRouter.get('/', UsersCtrlr.getUser)

// 修改 User
UsersRouter.put('/', UsersCtrlr.editUser)

export default UsersRouter
