"use client"
import { useState, useEffect } from "react"
import { Card3D } from "@/components/ui/3d-card"
import { BrandedButton } from "@/components/ui/branded-button"
import { User, Mail, MapPin, Save, Edit2, X } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

export function ProfileSettings() {
  const { user, refreshUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    address: {
      street: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
    },
  })

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        username: user.username || "",
        email: user.email || "",
        phone: user.phone || "",
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split("T")[0] : "",
        address: {
          street: user.address?.street || "",
          city: user.address?.city || "",
          state: user.address?.state || "",
          country: user.address?.country || "",
          postalCode: user.address?.postalCode || "",
        },
      })
    }
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name.startsWith("address.")) {
      const addressField = name.split(".")[1]
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, [addressField]: value },
      }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: "", text: "" })

    try {
      const res = await fetch("/api/player/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (data.success) {
        setMessage({ type: "success", text: "Profile updated successfully!" })
        setIsEditing(false)
        if (refreshUser) refreshUser()
      } else {
        setMessage({ type: "error", text: data.error || "Failed to update profile" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  const inputClasses = (editable = true) =>
    `w-full bg-[#0A1A2F] border border-[#2A3F55] rounded-lg px-4 py-3 text-[#F5F5F5] focus:outline-none focus:border-[#FFD700] transition-colors ${
      !editable || !isEditing ? "opacity-60 cursor-not-allowed" : ""
    }`

  return (
    <div className="max-w-3xl mx-auto pb-20 px-4 sm:px-6 pt-2">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Profile Information</h2>
          <p className="text-sm text-muted-foreground">Manage your personal information</p>
        </div>
        {!isEditing ? (
          <BrandedButton variant="secondary" onClick={() => setIsEditing(true)}>
            <Edit2 className="w-4 h-4 mr-2" />
            Edit
          </BrandedButton>
        ) : (
          <button
            onClick={() => setIsEditing(false)}
            className="text-muted-foreground hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      {message.text && (
        <div
          className={`mb-6 p-4 rounded-xl text-center ${
            message.type === "success"
              ? "bg-green-500/20 border border-green-500 text-green-400"
              : "bg-red-500/20 border border-red-500 text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Personal Information */}
        <Card3D className="mb-6">
          <div className="glass p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-lg">Personal Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-muted-foreground">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClasses()}
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-muted-foreground">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClasses()}
                  placeholder="Enter last name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-muted-foreground">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  disabled
                  className={inputClasses(false)}
                  placeholder="Username"
                />
                <p className="text-xs text-muted-foreground mt-1">Username cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-muted-foreground">Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClasses()}
                />
              </div>
            </div>
          </div>
        </Card3D>

        {/* Contact Information */}
        <Card3D className="mb-6">
          <div className="glass p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-lg">Contact Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-muted-foreground">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className={inputClasses(false)}
                  placeholder="Email address"
                />
                <p className="text-xs text-muted-foreground mt-1">Contact support to change email</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-muted-foreground">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClasses()}
                  placeholder="Enter phone number"
                />
              </div>
            </div>
          </div>
        </Card3D>

        {/* Address Information */}
        <Card3D className="mb-6">
          <div className="glass p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-lg">Address</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2 text-muted-foreground">Street Address</label>
                <input
                  type="text"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClasses()}
                  placeholder="Enter street address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-muted-foreground">City</label>
                <input
                  type="text"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClasses()}
                  placeholder="Enter city"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-muted-foreground">State/Province</label>
                <input
                  type="text"
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClasses()}
                  placeholder="Enter state"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-muted-foreground">Country</label>
                <input
                  type="text"
                  name="address.country"
                  value={formData.address.country}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClasses()}
                  placeholder="Enter country"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-muted-foreground">Postal Code</label>
                <input
                  type="text"
                  name="address.postalCode"
                  value={formData.address.postalCode}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClasses()}
                  placeholder="Enter postal code"
                />
              </div>
            </div>
          </div>
        </Card3D>

        {/* Save Button */}
        {isEditing && (
          <div className="flex gap-4">
            <BrandedButton type="submit" variant="primary" disabled={loading} className="flex-1">
              {loading ? (
                "Saving..."
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </BrandedButton>
            <BrandedButton type="button" variant="secondary" onClick={() => setIsEditing(false)}>
              Cancel
            </BrandedButton>
          </div>
        )}
      </form>
    </div>
  )
}
