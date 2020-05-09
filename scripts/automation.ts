import schedule from 'node-schedule'
import consola from 'consola'
import {col, Op} from 'sequelize'
import dayjs from 'dayjs'
import ReferModel from '../models/ReferModel'
import {JOB_STATES, REFER_STATES} from '../constants/status'
import {DB_DATETIME_FORMAT} from '../constants/format'
import JobModel from '../models/JobModel'

// 自动更新 Refer 状态
export const updateReferStatus = async () => {
  // 将过期的 Refer 更新为 rejected
  const newStatus = {
    status: REFER_STATES.rejected,
    updatedOn: dayjs().toDate()
  }

  await ReferModel.update(newStatus, {
    where: {
      expiration: {[Op.lt]: dayjs().toDate()} // expiration < now
    }
  })
}

// 自动更新 Job 状态
export const updateJobStatus = async () => {
  const newStatus = {status: JOB_STATES.expired}

  await JobModel.update(newStatus, {
    where: {
      [Op.or]: [
        {deadline: {[Op.lt]: dayjs().toDate()}}, // deadline < now
        {appliedCount: {[Op.eq]: col('applyTotal')}} // appliedCount === applyTotal
      ]
    }
  })
}

// 启动自动化任务
const automation = async () => {
  const rule = new schedule.RecurrenceRule()
  // 每天 0 点执行
  rule.hour = 0
  rule.minute = 0
  rule.second = 0

  // 启动任务
  consola.success('启动自动更新数据库任务')
  const job = schedule.scheduleJob(rule, async () => {
    consola.info(`更新数据库 ${dayjs().format(DB_DATETIME_FORMAT)}`)
    try {
      // 更新数据库
      await updateReferStatus()
      await updateJobStatus()
      consola.success(`更新成功 ${dayjs().format(DB_DATETIME_FORMAT)}`)
    } catch (e) {
      consola.error(e)
      job.cancel()
    }
  })
}

automation().then()
