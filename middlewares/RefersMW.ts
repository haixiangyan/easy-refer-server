import {NextFunction, Request, Response} from 'express'
import ReferModel from '../models/ReferModel'
import {Op} from 'sequelize'
import dayjs from 'dayjs'

class RefersMW {
  private static roleIdMapper: TMapper = {
    my: 'refereeId', // 查看自己的 Refer
    other: 'refererId' // 查看 candidate 的 Refer
  }
  /**
   * 查看是否自动拒绝
   */
  public static async updateReferStatus(req: Request, res: Response, next: NextFunction) {
    const {userId} = req.user as TJWTUser

    // 默认查看自己的 Refer
    if (!req.query.role) {
      req.query.role = 'my'
    }
    const roleId = RefersMW.roleIdMapper[req.query.role as string]

    // 将过期的 Refer 更新为 rejected
    await ReferModel.update({status: 'rejected'}, {
      where: {
        [roleId]: userId,
        expiration: {[Op.lt]: dayjs().toDate()}
      }
    })

    // 传递 roleId
    res.locals.roleId = roleId

    next(null)
  }
}

export default RefersMW
