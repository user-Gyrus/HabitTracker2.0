"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";
import { CheckCircle, AlertOctagon, Info } from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-center"
      richColors
      visibleToasts={3}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#1a1410]/95 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-white group-[.toaster]:border group-[.toaster]:border-white/10 group-[.toaster]:shadow-[0_8px_30px_rgba(0,0,0,0.5)] group-[.toaster]:rounded-full group-[.toaster]:px-6 group-[.toaster]:py-3 group-[.toaster]:w-auto group-[.toaster]:min-w-[300px] group-[.toaster]:flex group-[.toaster]:items-center group-[.toaster]:gap-3 group-[.toaster]:mb-12",
          description: "group-[.toast]:text-[#b5a79a] group-[.toast]:text-xs group-[.toast]:font-medium",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          error: "group-[.toaster]:border-red-500/20 group-[.toaster]:shadow-[0_0_20px_rgba(239,68,68,0.15)]",
          success: "group-[.toaster]:border-green-500/20 group-[.toaster]:shadow-[0_0_20px_rgba(34,197,94,0.15)]",
          info: "group-[.toaster]:border-blue-500/20 group-[.toaster]:shadow-[0_0_20px_rgba(59,130,246,0.15)]",
          title: "group-[.toast]:text-sm group-[.toast]:font-semibold group-[.toast]:tracking-wide",
        },
      }}
      icons={{
        success: <CheckCircle className="w-5 h-5 text-green-500" strokeWidth={2.5} />,
        error: <AlertOctagon className="w-5 h-5 text-red-500" strokeWidth={2.5} />,
        info: <Info className="w-5 h-5 text-blue-500" strokeWidth={2.5} />,
      }}
      {...props}
    />
  );
};

export { Toaster };
