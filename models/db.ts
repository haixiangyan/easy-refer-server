import {Sequelize} from 'sequelize-typescript'
import consola from 'consola'
import UserModel from '@/models/UserModel'
import JobModel from '@/models/JobModel'
import ReferModel from '@/models/ReferModel'
import ResumeModel from '@/models/ResumeModel'
import {parseEnv} from '@/utils/config'

// 创建连接实例
const initDB = () => {
  const {DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD} = process.env

  if (!DB_HOST || !DB_PORT || !DB_NAME || !DB_USER) {
    throw new Error('环境变量不存在')
  }

  const sequelize = new Sequelize({
    database: DB_NAME,
    dialect: 'mysql',
    host: DB_HOST,
    port: parseInt(DB_PORT),
    username: DB_USER,
    password: DB_PASSWORD,
    storage: ':memory:',
    models: [UserModel, JobModel, ReferModel, ResumeModel],
    logging: msg => console.log(msg),
    define: {
      charset: 'utf8'
    }
  })

  // Test connection
  sequelize.authenticate()
    .then(() => consola.success('成功连接数据库'))
    .catch((error) => consola.error('无法连接数据库: ', error))

  return sequelize
}

// 开始读入 Model
parseEnv()
const db = initDB()

export default db
