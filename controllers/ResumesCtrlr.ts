import {Request, Response} from 'express'
import ResumeModel from '@/models/ResumeModel'
import ReferModel from '@/models/ReferModel'

class ResumesCtrlr {
  public static async getResume(req: Request, res: Response) {
    const {userId} = req.user as TJWTUser
    const {resumeId} = req.params

    // 获取 resume
    const resume = await ResumeModel.findByPk(resumeId)

    if (!resume) {
      res.status(404)
      return res.json({message: '简历不存在'})
    }

    if (!await ResumesCtrlr.canAccessResume(userId, resumeId)) {
      res.status(403)
      return res.json({message: '无权访问该简历'})
    }

    res.json(resume)
  }

  private static async canAccessResume(userId: string, resumeId: string) {
    // 该简历是否属于该用户
    const hasResume = await ResumeModel.count({
      where: {resumeId, refereeId: userId},
    })

    // 该用户查看提交 refer 中的简历
    const viewRefer = await ResumeModel.count({
      where: {resumeId},
      include: [{
        model: ReferModel,
        as: 'refer',
        where: {refererId: userId}
      }]
    })

    return hasResume !== 0 || viewRefer !== 0
  }
}

export default ResumesCtrlr
