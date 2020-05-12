import {Request, Response} from 'express'
import ResumeModel from '@/models/ResumeModel'
import {TGetResume} from '@/@types/resume'

class ResumesCtrlr {
  public static async getResume(req: Request, res: Response<TGetResume>) {
    const {userId} = req.user as TJWTUser
    const {resumeId} = req.params

    const dbResume = await ResumeModel.findByPk(resumeId)

    // 简历是否存在
    if (!dbResume) {
      return res.status(404).json({message: '简历不存在'})
    }

    // 简历没有对应任何 Refer
    const dbRefer = await dbResume.$get('refer')
    if (!dbRefer) {
      return res.status(403).json({message: '无权访问该简历'})
    }

    // 只有用户自己和内推人可以查看
    if (dbRefer.refereeId !== userId && dbRefer.refererId !== userId) {
      return res.status(403).json({message: '无权访问该简历'})
    }

    return res.json(dbResume)
  }
}

export default ResumesCtrlr
