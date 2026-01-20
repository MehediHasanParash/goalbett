"use client"
import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

export function InputField({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  icon: Icon,
  className = "",
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false)
  const [focused, setFocused] = useState(false)

  const inputType = type === "password" && showPassword ? "text" : type

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <label className="text-sm font-medium text-foreground">{label}</label>}
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-700" />}
        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`
            w-full px-4 py-3 bg-card/50 border border-border rounded-xl
            text-slate-900 placeholder:text-slate-600
            focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
            transition-all duration-300 glass
            ${Icon ? "pl-12" : ""}
            ${error ? "border-destructive focus:ring-destructive/50" : ""}
            ${focused ? "scale-[1.02] shadow-lg" : ""}
          `}
          {...props}
        />
        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-700 hover:text-slate-900 transition-colors"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
