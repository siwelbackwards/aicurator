"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConfirmationDialog({ isOpen, onClose }: ConfirmationDialogProps) {
  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogContent className="sm:max-w-[425px] text-center p-6">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-2">Thank you for your interest!</h2>
        <h3 className="text-lg font-medium mb-4">What happens next?</h3>

        <ul className="text-left space-y-3 mb-6">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            A dedicated AI Curator advisor would reach you via email/phone in next 24 hours.
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            They would organize the product viewing.
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            Product evaluation & verification to be close.
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            Exchange of legal contract to close the transaction.
          </li>
        </ul>

        <Button onClick={onClose} className="w-full">
          Ok
        </Button>
      </DialogContent>
    </Dialog>
  );
}