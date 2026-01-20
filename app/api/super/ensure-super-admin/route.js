const connectDB = require("@/lib/mongodb").default
const User = require("@/lib/models/User").default

export async function POST(request) {
  try {
    await connectDB()

    // Check if super admin exists
    const existingSuperAdmin = await User.findOne({ role: "super_admin" })

    if (existingSuperAdmin) {
      return Response.json({
        success: true,
        message: "Super admin already exists",
        user: {
          email: existingSuperAdmin.email,
          username: existingSuperAdmin.username,
          role: existingSuperAdmin.role,
        },
      })
    }

    // Create super admin if doesn't exist
    const superAdmin = await User.create({
      fullName: "Super Admin",
      username: "superadmin",
      email: "super@gmail.com",
      password: "super123",
      role: "super_admin",
      status: "active",
      isEmailVerified: true,
    })

    return Response.json({
      success: true,
      message: "Super admin created successfully",
      user: {
        email: superAdmin.email,
        username: superAdmin.username,
        role: superAdmin.role,
      },
    })
  } catch (error) {
    console.error("Error ensuring super admin:", error)
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
