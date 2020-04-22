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

    // 将过期的 Refer 更新为 rejected
    await ReferModel.update({ status: 'rejected' }, {
      where: {
        refereeId: userId,
        expiration: {[Op.lt]: dayjs().toDate()}
      }
    })

    next(null)
  }
}

export default RefersMW
