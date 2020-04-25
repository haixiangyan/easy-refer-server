import UserModel from '@/models/UserModel'
import JobModel from '@/models/JobModel'
import {Op} from 'sequelize'
import dayjs from 'dayjs'
import ResumeModel from '@/models/ResumeModel'
import {Request, Response} from 'express'
import {TGetAvatar, TGetFullUser, TGetUser} from '@/@types/users'
import JobsCtrlr from '@/controllers/JobsCtrlr'
import {TGetResume} from '@/@types/resume'
import {generateResumeId} from '@/utils/auth'

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
      }],
    }) as UserModel

    const {jobList: userJobList, ...userInfo}: any = dbUser.toJSON()

    // 获取 JobItem
    let job = null
    if (userJobList.length > 0) {
      const {count, jobList} = await JobsCtrlr.parseJobList(1, 1, userJobList[0].jobId)
      job = count > 0 ? jobList[0] : null
    }

    return res.json({info: userInfo, job})
  }

  public static async editUser(req: Request, res: Response<TGetUser>) {
    const {userId} = req.user as TJWTUser
    const userForm: UserModel = req.body

    const dbUser = await UserModel.findByPk(userId) as UserModel

    await dbUser.update(userForm)

    return res.json(dbUser)
  }

  public static async createResume(req: Request, res: Response<TGetResume>) {
    const {filename} = req.file
    const {userId} = req.user as TJWTUser

    const dbUser = await UserModel.findByPk(userId)

    if (!dbUser) {
      return res.status(404).json({message: '该用户不存在'})
    }

    const url = `${req.protocol}://${req.hostname}:4000/${userId}/resumes/${filename}`

    const dbResume = await ResumeModel.create({
      resumeId: generateResumeId(userId, url),
      url,
      name: filename,
      refereeId: userId
    })

    return res.status(201).json(dbResume)
  }

  public static async createAvatar(req: Request, res: Response<TGetAvatar>) {
    const {filename} = req.file
    const {userId} = req.user as TJWTUser

    const dbUser = await UserModel.findByPk(userId) as UserModel

    dbUser.avatarUrl = `${req.protocol}://${req.hostname}:4000/${userId}/avatar/${filename}`

    await dbUser.save()

    return res.status(201).json({avatarUrl: dbUser.avatarUrl})
  }
}

export default UsersCtrlr
