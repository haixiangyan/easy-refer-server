import {RequestHandler} from 'express'
import {resumeMulter, avatarMulter} from '@/plugins/multer'

class UploadCtrlr {
  public static uploadResume: RequestHandler = resumeMulter.single('file')

  public static uploadAvatar: RequestHandler = avatarMulter.single('file')
}

export default UploadCtrlr
