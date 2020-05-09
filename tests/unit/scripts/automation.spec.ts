import db from '../../../models/db'
import {initMockDB, jobs, refers} from '../../../mocks/dbObjects'
import ReferModel from '../../../models/ReferModel'
import {updateJobStatus, updateReferStatus} from '../../../scripts/automation'
import {JOB_STATES, REFER_STATES} from '../../../constants/status'
import {DB_DATE_FORMAT} from '../../../constants/format'
import JobModel from '../../../models/JobModel'
import dayjs = require('dayjs')

const [expiredJob1, job1] = jobs
const [refer2] = refers

describe('automation', () => {
  beforeAll(async () => {
    await db.sync({force: true})
    await initMockDB()
  })
  afterAll(async () => await db.close())

  describe('updateReferStatus', () => {
    it('将过期的 Refer 变成 expired', async () => {
      // 修改成过期的 Refer
      await ReferModel.update({
        expiration: dayjs().subtract(3, 'day').toDate()
      }, {
        where: {referId: refer2.referId}
      })

      const prevDbRefer = await ReferModel.findByPk(refer2.referId)
      expect(prevDbRefer!.status).toEqual(REFER_STATES.processing)

      await updateReferStatus()

      const curtDbRefer = await ReferModel.findByPk(refer2.referId)
      expect(curtDbRefer!.status).toEqual(REFER_STATES.rejected)
      expect(curtDbRefer!.updatedOn).toEqual(dayjs().format(DB_DATE_FORMAT))

      // 恢复
      await ReferModel.update({
        expiration: dayjs().add(3, 'day').toDate(),
        status: REFER_STATES.processing
      }, {
        where: {referId: refer2.referId}
      })
    })
  })

  describe('updateJobStatus', () => {
    it('将过期的 Job 变成 expired', async () => {
      await JobModel.update({
        deadline: dayjs().subtract(1, 'day').toDate()
      }, {
        where: {jobId: job1.jobId}
      })

      const prevDbJob = await JobModel.findByPk(job1.jobId)
      expect(prevDbJob!.status).toEqual(JOB_STATES.active)

      await updateJobStatus()

      const curtDbJob = await JobModel.findByPk(job1.jobId)
      expect(curtDbJob!.status).toEqual(JOB_STATES.expired)

      // 恢复
      await JobModel.update({
        deadline: dayjs().add(1, 'day').toDate(),
        status: JOB_STATES.active
      }, {
        where: {jobId: job1.jobId}
      })
    })

    it('将申请满的 Job 变成 expired', async () => {
      await JobModel.update({
        appliedCount: job1.applyTotal
      }, {
        where: {jobId: job1.jobId}
      })

      const prevDbJob = await JobModel.findByPk(job1.jobId)
      expect(prevDbJob!.status).toEqual(JOB_STATES.active)

      await updateJobStatus()

      const curtDbJob = await JobModel.findByPk(job1.jobId)
      expect(curtDbJob!.status).toEqual(JOB_STATES.expired)

      // 恢复
      await JobModel.update({
        appliedCount: job1.appliedCount,
        status: JOB_STATES.active
      }, {
        where: {jobId: job1.jobId}
      })
    })
  })
})

