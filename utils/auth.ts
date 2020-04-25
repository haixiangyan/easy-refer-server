import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import {parseEnv} from '@/utils/config'
import {v5 as uuidv5} from 'uuid'

parseEnv()

export const generateJWT = (userId: string) => {
  const {JWT_SECRET} = process.env

  if (!JWT_SECRET) throw new Error('环境变量 JWT_SECRET 不存在')

  return 'Bearer ' + jwt.sign({
    userId
  }, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '10m'
  })
}

export const encryptPassword = (plainTextPassword: string) => {
  const {SALT_ROUNDS} = process.env

  if (!SALT_ROUNDS) throw new Error('环境亦是 SALT_ROUNDS 不存在')

  return bcrypt.hashSync(plainTextPassword, parseInt(SALT_ROUNDS))
}

export const generateUserId = (email: string) => {
  if (!process.env.USER_NAMESPACE) throw new Error('环境变量 USER_NAMESPACE 不存在')

  return uuidv5(email, process.env.USER_NAMESPACE)
}

export const generateJobId = (refererId: string, timestamp: number) => {
  if (!process.env.JOB_NAMESPACE) throw new Error('环境变量 JOB_NAMESPACE 不存在')

  const raw = `${refererId}-${timestamp}`

  return uuidv5(raw, process.env.JOB_NAMESPACE)
}
