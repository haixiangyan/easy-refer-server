import {NextFunction, Request, Response} from 'express'
import ReferModel from '../models/ReferModel'
import {Op} from 'sequelize'
import dayjs from 'dayjs'

class RefersMW {
  /**
   * 查看是否自动拒绝
   */
  public static async updateReferStatus(req: Request, res: Response, next: NextFunction) {
    const {userId} = req.user as TJWTUser
    const whereClause: TMapper = {
      my: {refereeId: userId},
      other: {refererId: userId}
    }

    // 将过期的 Refer 更新为 rejected
    await ReferModel.update({status: 'rejected'}, {
      where: {
        ...whereClause[req.query.role as string],
        expiration: {[Op.lt]: dayjs().toDate()}
      }
    })

    next(null)
  }

  public static async validateGetReferList(req: Request, res: Response, next: NextFunction) {
    const {role, page, limit} = req.query

    // 检查参数
    if (!role || !page || !limit) {
      res.status(422)
      return res.json({message: '缺少参数'})
    }

    next(null)
  }
}

export default RefersMW
