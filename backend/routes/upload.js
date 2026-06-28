const express = require('express')
const multer = require('multer')
const cloudinary = require('../config/cloudinary')

const router = express.Router()

// Memory storage — no temp files on disk
const upload = multer({ storage: multer.memoryStorage() })

/**
 * Upload a buffer directly to Cloudinary via stream.
 */
function uploadBufferToCloudinary(buffer, folder = 'fixnow/general') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto' },
      (error, result) => {
        if (error) return reject(error)
        resolve(result)
      }
    )
    stream.end(buffer)
  })
}

router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      })
    }

    const result = await uploadBufferToCloudinary(req.file.buffer)

    res.json({
      success: true,
      imageUrl: result.secure_url
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

module.exports = router