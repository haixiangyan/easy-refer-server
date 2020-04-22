import UserModel from '@/models/UserModel'
import JobModel from '@/models/JobModel'
import {Op} from 'sequelize'
import dayjs from 'dayjs'
import ResumeModel from '@/models/ResumeModel'
import ReferModel from '@/models/ReferModel'
import {Request, Response} from 'express'

class UsersCtrlr {
  public static async getUser(req: Request, res: Response) {
    const {userId} = req.user as TJWTUser

    const user = await UserModel.findByPk(userId, {
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
    })

    if (!user) {
      res.status(404)
      return res.json({message: '该用户不存在'})
    }

    // 统计已处理自己的 refer
    const myReferTotal = await ReferModel.count({
      where: {refereeId: userId}
    })
    const approvedMyReferCount = await ReferModel.count({
      where: {refereeId: userId, status: 'approved'}
    })
    const otherReferTotal = await ReferModel.count({
      where: {refererId: userId}
    })
    const approvedOtherReferCount = await ReferModel.count({
      where: {refererId: userId, status: 'approved'}
    })

    const {jobList, resumeList, ...userInfo}: any = user.toJSON()
    const info: TUser = {
      ...userInfo,
      myReferTotal,
      approvedMyReferCount,
      otherReferTotal,
      approvedOtherReferCount
    }

    res.json({
      info,
      job: jobList.length > 0 ? jobList[0] : null,
      resume: resumeList.length > 0 ? resumeList[0] : null,
    })
  }

  public static async editUser(req: Request, res: Response) {
    const {userId} = req.user as TJWTUser
    const userForm: TUserForm = req.body

    const updatedUser = await UserModel.findByPk(userId)

    if (!updatedUser) {
      res.status(404)
      return res.json({
        message: '用户不存在'
      })
    }

    Object.entries(userForm).forEach(([key, value]) => {
      updatedUser[key] = value
    })

    await updatedUser.save()

    res.json(updatedUser)
  }
}

export default UsersCtrlr
