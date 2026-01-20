"use client"

import type * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useTenant } from "@/components/providers/tenant-provider"

const brandedButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-bold transition-all disabled:pointer-events-none disabled:opacity-50 outline-none relative overflow-hidden group",
  {
    variants: {
      variant: {
        primary: "bg-secondary text-secondary-foreground shadow-lg hover:shadow-xl hover:scale-105 hover:opacity-90",
        secondary:
          "bg-gradient-to-r from-[#0A1A2F] to-[#1A2F45] text-secondary border-2 border-secondary shadow-lg hover:shadow-xl hover:scale-105",
        accent:
          "bg-gradient-to-r from-[#1A2F45] to-[#0D1F35] text-[#F5F5F5] border border-secondary shadow-md hover:shadow-lg hover:border-secondary hover:scale-105",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-8 rounded-md px-4",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
)

interface BrandedButtonProps extends React.ComponentProps<"button">, VariantProps<typeof brandedButtonVariants> {
  asChild?: boolean
  showLogo?: boolean
}

function BrandedButton({
  className,
  variant,
  size,
  asChild = false,
  showLogo = true,
  children,
  ...props
}: BrandedButtonProps) {
  const Comp = asChild ? Slot : "button"
  const { logoUrl } = useTenant()

  return (
    <Comp className={cn(brandedButtonVariants({ variant, size, className }))} {...props}>
      {showLogo && logoUrl && (
        <Image src={logoUrl || "/placeholder.svg"} alt="" width={24} height={24} className="w-6 h-6" />
      )}
      <span className="relative z-10">{children}</span>
      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </Comp>
  )
}

export { BrandedButton, brandedButtonVariants }
