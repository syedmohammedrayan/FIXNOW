const express = require('express')
const multer = require('multer')
const cloudinary = require('../config/cloudinary')

const router = express.Router()

const upload = multer({
    dest: 'uploads/'
})

router.post('/', upload.single('image'), async (req, res) => {

    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            })
        }

        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'fixnow/general'
        })

        // Remove file from local storage after upload to Cloudinary
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path)
        }

        res.json({
            success: true,
            imageUrl: result.secure_url
        })

    } catch (error) {
        // Cleanup on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path)
        }

        res.status(500).json({
            success: false,
            message: error.message
        })

    }

})

module.exports = router