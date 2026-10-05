const express = require('express')
const multer = require('multer')
const cloudinary = require('../config/cloudinary')

const router = express.Router()

// Use memory storage so the file buffer is piped directly to Cloudinary — no temp files on disk.
const upload = multer({ storage: multer.memoryStorage() })

/**
 * Wraps Cloudinary's stream uploader in a Promise so we can use async/await.
 * Cloudinary's upload_stream uses a callback pattern, which doesn't work with await directly.
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
    // Write the file buffer into the Cloudinary upload stream.
    stream.end(buffer)
  })
}

// POST /api/upload — accepts a single image file and returns its Cloudinary CDN URL.
// Used by the frontend to upload images before associating the URL with a booking or profile.
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      })
    }

    const result = await uploadBufferToCloudinary(req.file.buffer)

    // Return the secure HTTPS Cloudinary URL so the frontend can store and display it.
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