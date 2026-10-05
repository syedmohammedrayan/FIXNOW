// Configures Cloudinary using environment variables — used for uploading technician avatars
// and government ID images so that image URLs are publicly accessible CDN links.
const cloudinary = require('cloudinary').v2

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

// Export the configured cloudinary instance for use in the users route uploader.
module.exports = cloudinary