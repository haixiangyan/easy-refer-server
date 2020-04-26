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

    next(false)
  }

  /**
   * 判断是否存在该 Refer
   */
  public static async existRefer(req: Request, res: Response, next: NextFunction) {
    const {referId} = req.params

    const dbRefer = await ReferModel.findByPk(referId)

    if (!dbRefer) {
      res.status(404)
      return res.json({message: '该内推不存在'})
    }

    // 传递数据库中的 Refer
    res.locals.dbRefer = dbRefer

    next(false)
  }
}

export default RefersMW
