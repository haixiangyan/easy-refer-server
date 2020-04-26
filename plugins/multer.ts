import multer from 'multer'
import {IMAGE_MIME_TYPES, IMAGE_SIZE, RESUME_MIME_TYPES, RESUME_SIZE} from '@/constants/file'
import {createUserFolder, getUploadAssetsPath, getUploadFileName} from '@/utils/upload'

const resumeStorage = multer.diskStorage({
  destination(req, file, callback) {
    const {userId} = req.user as TJWTUser

    createUserFolder(userId)

    callback(null, getUploadAssetsPath(userId, 'resumes'))
  },
  filename(req, file, callback) {
    callback(null, getUploadFileName(file.originalname))
  }
})

export const resumeMulter = multer({
  storage: resumeStorage,
  fileFilter: (req, file, cb) => {
    const {mimetype, size} = file

    if (!RESUME_MIME_TYPES.includes(mimetype)) {
      return cb(new Error('上传简历格式不正确'))
    }
    if (size > RESUME_SIZE) {
      return cb(new Error(`上传简历不能超过 ${RESUME_SIZE}`))
    }

    cb(null, true)
  },
  limits: {fileSize: RESUME_SIZE}
})

const avatarStorage = multer.diskStorage({
  destination(req, file, callback) {
    const {userId} = req.user as TJWTUser

    createUserFolder(userId)

    callback(null, getUploadAssetsPath(userId, 'avatar'))
  },
  filename(req, file, callback) {
    callback(null, getUploadFileName(file.originalname))
  }
})

export const avatarMulter = multer({
  storage: avatarStorage,
  fileFilter: (req, file, cb) => {
    const {mimetype, size} = file

    if (!IMAGE_MIME_TYPES.includes(mimetype)) {
      return cb(new Error('上传头像格式不正确'))
    }
    if (size > IMAGE_SIZE) {
      return cb(new Error(`上传头像不能超过 ${IMAGE_SIZE}`))
    }

    cb(null, true)
  },
  limits: {fileSize: IMAGE_SIZE}
})

