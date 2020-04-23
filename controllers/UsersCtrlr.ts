import UserModel from '@/models/UserModel'
import JobModel from '@/models/JobModel'
import {Op} from 'sequelize'
import dayjs from 'dayjs'
import ResumeModel from '@/models/ResumeModel'
import ReferModel from '@/models/ReferModel'
import {Request, Response} from 'express'
import {TGetFullUser, TGetUser, TUserInfo} from '@/@types/users'
import JobsCtrlr from '@/controllers/JobsCtrlr'

class UsersCtrlr {
  public static async getUser(req: Request, res: Response<TGetFullUser>) {
    const {userId} = req.user as TJWTUser

    const dbUser = await UserModel.findByPk(userId, {
      include: [{
        model: JobModel,
        as: 'jobList',
        limit: 1,
        order: [['createdAt', 'DESC']],
        where: {deadline: {[Op.gte]: dayjs().toDate()}}
      },
        {
          model: ResumeModel,
          as: 'resumeList',
          limit: 1,
          order: [['createdAt', 'DESC']]
        }],
    }) as UserModel

    // 统计已处理自己的 refer
    const referRatio = await UsersCtrlr.getReferRatio(userId)

    const {jobList, resumeList, ...userInfo}: any = dbUser.toJSON()

    // 获取 userInfo
    const info: TUserInfo = {...userInfo, ...referRatio}
    // 获取 JobItem
    let job = null
    if (jobList.length > 0) {
      const {count, jobItemList} = await JobsCtrlr.parseJobItemList(1, 1, jobList[0].jobId)
      job = count > 0 ? jobItemList[0] : null
    }

    return res.json({
      info,
      job,
      resume: resumeList.length > 0 ? resumeList[0] : null,
    })
  }

  public static async editUser(req: Request, res: Response<TGetUser>) {
    const {userId} = req.user as TJWTUser
    const userForm: UserModel = req.body

    const dbUser = await UserModel.findByPk(userId) as UserModel

    await dbUser.update(userForm)

    return res.json(dbUser)
  }

  private static async getReferRatio(userId: string) {
    // 统计已处理自己的 refer
    const myReferTotal = await ReferModel.count({
      where: {refereeId: userId}
    })
    const processedMyReferCount = await ReferModel.count({
      where: {refereeId: userId, status: {[Op.ne]: 'processing'}}
    })
    const otherReferTotal = await ReferModel.count({
      where: {refererId: userId}
    })
    const processedOtherReferCount = await ReferModel.count({
      where: {refererId: userId, status: {[Op.ne]: 'processing'}}
    })

    return {
      myReferTotal,
      processedMyReferCount,
      otherReferTotal,
      processedOtherReferCount
    }
  }
}

export default UsersCtrlr
