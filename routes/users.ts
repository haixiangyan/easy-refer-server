import express from 'express'
import UserModel from '@/models/UserModel'

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

export default UsersRouter
