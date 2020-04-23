import UserModel from '@/models/UserModel'
import ResumeModel from '@/models/ResumeModel'
import {v4 as uuidv4} from 'uuid'
import {Request, RequestHandler, Response} from 'express'
import UploadMW from '@/middlewares/UploadMW'
import {TGetResume} from '@/@types/resume'
import {TGetAvatar} from '@/@types/users'

class UploadCtrlr {
  public static uploadResume: RequestHandler = UploadMW.resumeMulter.single('file')

  public static async createResume(req: Request, res: Response<TGetResume>) {
    const {filename} = req.file
    const {userId} = req.user as TJWTUser

    const dbUser = await UserModel.findByPk(userId)

    if (!dbUser) {
      return res.status(404).json({message: '该用户不存在'})
    }

    const dbResume = await ResumeModel.create({
      resumeId: uuidv4(),
      url: `${req.protocol}://${req.hostname}:4000/${userId}/resumes/${filename}`,
      name: filename,
      refereeId: userId
    })

    return res.status(201).json(dbResume)
  }

  public static uploadAvatar: RequestHandler = UploadMW.avatarMulter.single('file')

  public static async createAvatar(req: Request, res: Response<TGetAvatar>) {
    const {filename} = req.file
    const {userId} = req.user as TJWTUser

    const dbUser = await UserModel.findByPk(userId) as UserModel

    dbUser.avatarUrl = `${req.protocol}://${req.hostname}:4000/${userId}/avatar/${filename}`

    await dbUser.save()

    return res.status(201).json({avatarUrl: dbUser.avatarUrl})
  }
}

export default UploadCtrlr
