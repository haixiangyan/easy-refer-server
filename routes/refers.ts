import express from 'express'
import RefersController from '@/controllers/RefersController'
import RefersMW from '@/middlewares/RefersMW'

// '/refers'
const RefersRouter = express.Router()

// 获取 My Refer / Other Refer
RefersRouter.get('/', RefersMW.updateReferStatus, RefersController.getReferList)

// 获取一个 Refer
RefersRouter.get('/:referId', RefersMW.updateReferStatus, RefersController.getRefer)

// 创建 Refer
RefersRouter.post('/:jobId', RefersController.createRefer)

// 部分修改 Refer
RefersRouter.patch('/:referId', RefersController.editRefer)

// 删除 Refer
RefersRouter.delete('/:referId', RefersController.deleteRefer)

export default RefersRouter
