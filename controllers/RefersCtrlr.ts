import {Request, Response} from 'express'
import ReferModel from '../models/ReferModel'
import ResumeModel from '../models/ResumeModel'
import JobModel from '../models/JobModel'
import UserModel from '../models/UserModel'
import {Op} from 'sequelize'
import {v4 as uuidv4} from 'uuid'
import dayjs from 'dayjs'

class RefersCtrlr {
  public static async getReferList(req: Request, res: Response) {
    const {userId} = req.user as TJWTUser
    const {roleId} = res.locals
    const page = parseInt(req.query.page as string)
    const limit = parseInt(req.query.limit as string)

    if (Number.isNaN(page) || Number.isNaN(limit)) {
      return res.status(422).json({message: '缺少参数'})
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
      where: {[roleId]: userId}
    })

    return res.json({referList: referList, total})
  }

  public static async getRefer(req: Request, res: Response) {
    const {userId} = req.user as TJWTUser
    const {dbRefer} = res.locals

    // Refer 不属于该用户，且 Refer 不能被别的 Referer 看到
    if (dbRefer.refereeId !== userId && dbRefer.refererId !== userId) {
      return res.status(403).json({message: '无权限访问该内推'})
    }

    dbRefer.resume = await dbRefer.$get('resume')

    return res.json(dbRefer)
  }

  public static async createRefer(req: Request, res: Response) {
    const {userId} = req.user as TJWTUser
    const {jobId} = req.params
    const referForm = req.body

    const dbJob = await JobModel.findByPk(jobId, {
      include: [{
        model: ReferModel, as: 'referList', where: {
          // 重复申请或者自己创建的内推职位
          [Op.or]: [{refereeId: userId}, {refererId: userId}]
        },
        separate: true // 分开查询非法申请的 SQL
      }]
    })

    if (!dbJob) {
      return res.status(404).json({message: '该内推职位不存在'})
    }

    // 重复申请或者自己创建的内推职位
    if (dbJob.referList && dbJob.referList.length > 0) {
      return res.status(403).json({message: '你已申请该内推职位或这是你创建的内推职位'})
    }

    const dbRefer = await ReferModel.create({
      ...referForm,
      referId: uuidv4(),
      jobId,
      refereeId: userId,
      refererId: dbJob.refererId,
      status: 'processing',
      updatedOn: dayjs().toDate(),
      expiration: dayjs().add(dbJob.autoRejectDay, 'day')
    })

    return res.status(201).json(dbRefer)
  }

  public static async editRefer(req: Request, res: Response) {
    const {userId} = req.user as TJWTUser
    const {dbRefer} = res.locals
    const patchReferForm = req.body

    if (dbRefer.refereeId !== userId) {
      return res.status(403).json({message: '无权限访问该内推'})
    }

    await dbRefer.update({
      ...patchReferForm,
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
