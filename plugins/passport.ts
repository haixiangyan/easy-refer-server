import passport from 'passport'
import {Strategy as LocalStrategy} from 'passport-local'
import UserModel from '../models/UserModel'

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, async (email, password, cb) => {
    const user = await UserModel.findOne({
      where: {email}
    })

    if (!user) return cb(null, false, {message: '用户不存在'})

    if (user.password !== password) return cb(null, false, {message: '密码不正确'})

    cb(null, user, {message: '登录成功'})
  }
))

export default passport
