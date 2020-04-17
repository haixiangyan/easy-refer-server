import path from 'path'
import dotenv from 'dotenv'

// 解析 .env
export const parseEnv = () => {
  const {NODE_ENV} = process.env
  if (NODE_ENV !== 'development' && NODE_ENV !== 'dev-test') return

  const envPath = path.resolve(__dirname, '../.env')
  const result = dotenv.config({
    path: envPath
  })

  if (result.error) {
    throw result.error
  }
}
