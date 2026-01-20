"use client"

export function AnimatedButton({
  children,
  variant = "primary",
  size = "default",
  className = "",
  onClick,
  disabled = false,
  ...props
}) {
  const baseClasses =
    "btn-3d relative overflow-hidden font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"

  const variants = {
    primary:
      "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 neon-green",
    secondary:
      "bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground hover:from-secondary/90 hover:to-secondary/70 neon-blue",
    accent: "bg-gradient-to-r from-accent to-accent/80 text-accent-foreground hover:from-accent/90 hover:to-accent/70",
    gold: "bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:from-yellow-300 hover:to-yellow-500",
    glass: "glass text-foreground hover:bg-white/10",
  }

  const sizes = {
    sm: "px-4 py-2 text-sm rounded-lg",
    default: "px-6 py-3 text-base rounded-xl",
    lg: "px-8 py-4 text-lg rounded-2xl",
  }

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
    </button>
  )
}
