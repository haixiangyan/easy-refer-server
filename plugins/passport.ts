import passport from 'passport'
import {Strategy as LocalStrategy} from 'passport-local'
import {Strategy as JWTStrategy, ExtractJwt} from 'passport-jwt'
import UserModel from '../models/UserModel'
import bcrypt from 'bcrypt'

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, async (email, password, callback) => {
    const dbUser = await UserModel.findOne({
      where: {email}
    })

    if (!dbUser) {
      return callback(null, false, {message: '用户不存在'})
    }

    if (!dbUser.password) {
      return callback(null, false, {message: '该用户需要激活使用'})
    }

    if (!bcrypt.compareSync(password, dbUser.password)) {
      return callback(null, false, {message: '密码不正确'})
    }

    callback(null, dbUser, {message: '登录成功'})
  }
))

passport.use(new JWTStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET
  },
  async (jwtPayload, cb) => {
    try {
      const user = {userId: jwtPayload.userId}

      cb(null, user)
    } catch (err) {
      cb(err)
    }
  }
))

export default passport
