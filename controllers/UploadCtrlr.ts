import {RequestHandler} from 'express'
import {resumeMulter} from '@/plugins/multer'

class UploadCtrlr {
  public static uploadResume: RequestHandler = resumeMulter.single('file')
}

export default UploadCtrlr
