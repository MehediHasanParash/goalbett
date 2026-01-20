"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function FormModal({ isOpen, onClose, title, children, onSubmit, submitLabel = "Submit", isLoading = false }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0D1F35] border border-[#2A3F55] text-[#F5F5F5]">
        <DialogHeader className="border-b border-[#2A3F55]">
          <DialogTitle className="text-[#FFD700]">{title}</DialogTitle>
        </DialogHeader>

        <div className="py-4 max-h-96 overflow-y-auto">{children}</div>

        <DialogFooter className="border-t border-[#2A3F55] pt-4 flex gap-2">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-[#B8C5D6] text-[#B8C5D6] hover:bg-[#B8C5D6]/10 bg-transparent"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F] font-bold"
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
