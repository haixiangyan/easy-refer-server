import express from 'express'
import RefersCtrlr from '@/controllers/RefersCtrlr'
import RefersMW from '@/middlewares/RefersMW'

// '/refers'
const RefersRouter = express.Router()

// 获取 My Refer / Other Refer
RefersRouter.get('/', RefersMW.updateReferStatus, RefersCtrlr.getReferList)

// 获取一个 Refer
RefersRouter.get('/:referId', RefersMW.updateReferStatus, RefersCtrlr.getRefer)

// 创建 Refer
RefersRouter.post('/:jobId', RefersCtrlr.createRefer)

// 部分修改 Refer
RefersRouter.patch('/:referId', RefersCtrlr.editRefer)

// 删除 Refer
RefersRouter.delete('/:referId', RefersCtrlr.deleteRefer)

export default RefersRouter
