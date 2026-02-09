"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"   // Vite không có next-themes → mình để light hoặc dark tùy thích
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "bg-pink-50 border-pink-200 text-pink-900 shadow-lg",
          title: "text-lg font-bold",
          description: "text-pink-700",
          actionButton: "bg-pink-500 hover:bg-pink-600 text-white",
          cancelButton: "bg-white text-pink-600 border-pink-200",
          success: "bg-green-50 border-green-300 text-green-900",
          error: "bg-red-50 border-red-300 text-red-900",
          info: "bg-blue-50 border-blue-300 text-blue-900",
        },
      }}
      {...props}
    />
  )
}

export { Toaster };
