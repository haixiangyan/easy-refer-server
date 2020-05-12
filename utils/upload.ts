import path from 'path'
import fs from 'fs'
import rimraf from 'rimraf'
import consola from 'consola'

export const UPLOAD_DIR = path.resolve(__dirname, '../upload')

export const getUploadAssetsPath = (userId: string, assets: string) => {
  return path.resolve(UPLOAD_DIR, userId, assets)
}

export const getUploadFileName = (originalName: string) => {
  const [fileName, extension] = originalName.split('.')

  // 原文件名-时间戳.后缀
  return `${fileName}-${Date.now()}.${extension}`
}

export const createUploadDir = () => {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR)
  }
}

export const createUserFolder = (userId: string) => {
  const userFolderPath = path.resolve(UPLOAD_DIR, userId)

  if (fs.existsSync(userFolderPath)) return

  fs.mkdirSync(path.resolve(userFolderPath))
  fs.mkdirSync(path.resolve(userFolderPath, 'resumes'))
}

export const clearUploadDir = () => {
  rimraf.sync(UPLOAD_DIR)
}

export const getResumePath = (userId: string, filename: string) => {
  return path.resolve(UPLOAD_DIR, userId, 'resumes', filename)
}


export const deleteResume = (userId: string, filename: string) => {
  const resumePath = getResumePath(userId, filename)

  if (!fs.existsSync(resumePath)) {
    return consola.warn(`简历 ${resumePath} 不存在`)
  }

  fs.unlinkSync(resumePath)
  consola.success(`已删除简历 ${resumePath}`)
}
