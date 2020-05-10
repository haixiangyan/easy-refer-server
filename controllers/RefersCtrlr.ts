import {Request, Response} from 'express'
import {TGetRefer, TGetReferList} from '@/@types/refers'
import ReferModel from '../models/ReferModel'
import ResumeModel from '../models/ResumeModel'
import JobModel from '../models/JobModel'
import UserModel from '../models/UserModel'
import dayjs from 'dayjs'
import {generateReferId, generateUserId} from '@/utils/auth'

class RefersCtrlr {
  private static roleIdMapper: TMapper = {
    my: 'refereeId', // 查看自己的 Refer
    other: 'refererId' // 查看 candidate 的 Refer
  }

  public static async getReferList(req: Request, res: Response<TGetReferList>) {
    const {userId} = req.user as TJWTUser

    // 默认查看自己的 Refer
    if (!req.query.role) {
      req.query.role = 'my'
    }
    const roleId = RefersCtrlr.roleIdMapper[req.query.role as string]
    const page = parseInt(req.query.page as string)
    const limit = parseInt(req.query.limit as string)


    if (Number.isNaN(page) || Number.isNaN(limit) || page < 0 || limit < 1) {
      return res.status(422).json({message: '参数不正确'})
    }

    const {count: total, rows: referList} = await ReferModel.findAndCountAll({
      offset: page - 1,
      limit,
      order: [['createdAt', 'DESC']],
      include: [
        ResumeModel, JobModel,
        {model: UserModel, as: 'referer'},
        {model: UserModel, as: 'referee'}
      ],
      where: {[roleId]: userId, status: 'processing'}
    })

    return res.json({referList: referList, total})
  }

  public static async getRefer(req: Request, res: Response<TGetRefer>) {
    const {userId} = req.user as TJWTUser
    const {dbRefer} = res.locals

    // Refer 不属于该用户，且 Refer 不能被别的 Referer 看到
    if (dbRefer.refereeId !== userId && dbRefer.refererId !== userId) {
      return res.status(403).json({message: '无权限访问该内推'})
    }

    const refer = dbRefer.toJSON()

    const dbResume = await dbRefer.$get('resume')
    refer.resume = !dbResume ? null : dbResume.toJSON()

    refer.referer = (await dbRefer.$get('referer')).toJSON()
    refer.referee = (await dbRefer.$get('referee')).toJSON()
    refer.job = (await dbRefer.$get('job')).toJSON()

    return res.json(refer)
  }

  public static async createRefer(req: Request, res: Response<TGetRefer>) {
    const {jobId} = req.params
    const referForm: ReferModel = req.body

    const dbJob = await JobModel.findByPk(jobId)

    if (!dbJob) {
      return res.status(404).json({message: '该内推职位不存在'})
    }

    if (!referForm.email) {
      return res.status(422).json({message: '参数不正确'})
    }

    const userId = generateUserId(referForm.email)
    const appliedDbRefer = await dbJob.$get('referList', {
      where: {refereeId: userId}
    })

    // 重复申请或者自己创建的内推职位
    if (dbJob.refererId === userId|| appliedDbRefer.length > 0) {
      return res.status(403).json({message: '你已申请该内推职位或这是你创建的内推职位'})
    }

    // 如果没有该用户，则创建
    await UserModel.findOrCreate({
      where: {userId},
      defaults: {userId, email: referForm.email}
    })

    const dbRefer = await ReferModel.create({
      ...referForm,
      referId: generateReferId(dbJob.refererId, userId, dbJob.jobId, new Date().getTime()),
      jobId,
      refereeId: userId,
      refererId: dbJob.refererId,
      status: 'processing',
      updatedOn: dayjs().toDate(),
      expiration: dayjs().add(dbJob.autoRejectDay, 'day')
    })

    // 申请 +1
    dbJob.increment('appliedCount')

    return res.status(201).json(dbRefer)
  }

  public static async editRefer(req: Request, res: Response<TGetRefer>) {
    const {userId} = req.user as TJWTUser
    const {dbRefer} = res.locals
    const referForm: ReferModel = req.body

    // Referee 才能修改自己的 Refer
    if (dbRefer.refereeId !== userId) {
      return res.status(403).json({message: '无权限访问该内推'})
    }

    await dbRefer.update({
      ...referForm,
      updatedOn: dayjs().toDate()
    })

    return res.json(dbRefer)
  }

  public static async updateReferStatus(req: Request, res: Response<TGetRefer>) {
    const {userId} = req.user as TJWTUser
    const {dbRefer} = res.locals
    const {status} = req.body

    // Referer 才能修改 Refer 状态
    if (dbRefer.refererId !== userId) {
      return res.status(403).json({message: '无权限访问该内推'})
    }

    // 判断 referForm 是否存在 status
    if (!status) {
      return res.status(422).json({message: '参数不正确'})
    }

    await dbRefer.update({
      status,
      updatedOn: dayjs().toDate()
    })

    return res.json(dbRefer)
  }

  public static async deleteRefer(req: Request, res: Response) {
    const {userId} = req.user as TJWTUser
    const {dbRefer} = res.locals

    if (dbRefer.refereeId !== userId) {
      return res.status(403).json({message: '无权限访问该内推'})
    }

    // 如果该 Refer 包含有 Resume 则删除 Resume
    const resume = await dbRefer.$get('resume')
    resume && await resume.destroy()

    // 最后删除该 Refer
    await dbRefer.destroy()

    return res.json()
  }
}

export default RefersCtrlr
