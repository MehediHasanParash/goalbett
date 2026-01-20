export async function uploadImage(fileBuffer, folder = "avatars") {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary credentials not configured")
  }

  try {
    // Convert buffer to base64
    const base64File = `data:image/png;base64,${fileBuffer.toString("base64")}`

    // Create form data for Cloudinary
    const timestamp = Math.round(new Date().getTime() / 1000)
    const folderPath = `goal-betting/${folder}`

    // Generate signature
    const signatureString = `folder=${folderPath}&timestamp=${timestamp}${apiSecret}`
    const signature = await generateSHA1(signatureString)

    const formData = new FormData()
    formData.append("file", base64File)
    formData.append("folder", folderPath)
    formData.append("timestamp", timestamp.toString())
    formData.append("api_key", apiKey)
    formData.append("signature", signature)

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || "Upload failed")
    }

    const result = await response.json()
    return {
      secure_url: result.secure_url,
      public_id: result.public_id,
    }
  } catch (error) {
    throw new Error(`Image upload failed: ${error.message}`)
  }
}

export async function deleteImage(publicId) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret || !publicId) {
    return
  }

  try {
    const timestamp = Math.round(new Date().getTime() / 1000)
    const signatureString = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`
    const signature = await generateSHA1(signatureString)

    const formData = new FormData()
    formData.append("public_id", publicId)
    formData.append("timestamp", timestamp.toString())
    formData.append("api_key", apiKey)
    formData.append("signature", signature)

    await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: "POST",
      body: formData,
    })
  } catch (error) {
    console.error("Error deleting image:", error)
  }
}

// Helper to generate SHA1 hash for Cloudinary signature
async function generateSHA1(message) {
  const encoder = new TextEncoder()
  const data = encoder.encode(message)
  const hashBuffer = await crypto.subtle.digest("SHA-1", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}
