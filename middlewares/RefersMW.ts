import {NextFunction, Request, Response} from 'express'
import ReferModel from '../models/ReferModel'

class RefersMW {
  /**
   * 判断是否存在该 Refer
   */
  public static async existRefer(req: Request, res: Response, next: NextFunction) {
    const {referId} = req.params

    const dbRefer = await ReferModel.findByPk(referId)

    if (!dbRefer) {
      return res.status(404).json({message: '该内推不存在'})
    }

    // 传递数据库中的 Refer
    res.locals.dbRefer = dbRefer

    next(false)
  }
}

export default RefersMW
