import multer from 'multer'
import path from 'path'

// Configuración para subir avatares
const storageAvatars = multer.diskStorage({
  destination: 'uploads/avatars',
  filename: (req, file, cb) => {
    const userId = req.params.user_id || 'unknown_user'
    const timestamp = new Date().toISOString().replace(/:/g, '-')
    const fileExt = path.extname(file.originalname).toLowerCase()
    cb(null, `AVATAR_${userId}_${timestamp}${fileExt}`)
  }
})

// Configuración para subir imágenes de referencia
const storageReferenceImages = multer.diskStorage({
  destination: 'uploads/reference_images',
  filename: (req, file, cb) => {
    const referenceId = req.params.reference_id || 'unknown_reference'
    const timestamp = new Date().toISOString().replace(/:/g, '-')
    const fileExt = path.extname(file.originalname).toLowerCase()
    cb(null, `REFERENCE_${referenceId}_${timestamp}${fileExt}`)
  }
})

// Middlewares para subida
const uploadAvatars = multer({
  storage: storageAvatars,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.png', '.jpg', '.jpeg']
    const fileExt = path.extname(file.originalname).toLowerCase()
    if (!allowedExtensions.includes(fileExt)) {
      return cb(new Error(`Extensión no permitida: ${fileExt}`))
    }
    cb(null, true)
  }
})

const uploadReferenceImages = multer({
  storage: storageReferenceImages,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.png', '.jpg', '.jpeg']
    const fileExt = path.extname(file.originalname).toLowerCase()
    if (!allowedExtensions.includes(fileExt)) {
      return cb(new Error(`Extensión no permitida: ${fileExt}`))
    }
    cb(null, true)
  }
})

export default { uploadAvatars, uploadReferenceImages }
