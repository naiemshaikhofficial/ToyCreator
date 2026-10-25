"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";

export interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

export interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

export const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as unknown as React.ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <motion.div
      className={cn(
        "h-full px-3 py-4 hidden md:flex md:flex-col bg-[#101010] border-r border-[#242424] w-[260px] shrink-0 select-none z-30",
        className
      )}
      animate={{
        width: animate ? (open ? "260px" : "64px") : "260px",
      }}
      transition={{
        duration: 0.25,
        ease: "easeInOut",
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  return (
    <div
      className={cn(
        "h-14 px-4 flex flex-row md:hidden items-center justify-between bg-[#101010] border-b border-[#242424] w-full shrink-0",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2.5">
        <picture>
          <source srcSet="/logo.webp" type="image/webp" />
          <img
            src="/logo.png"
            alt="Toy Creator Emblem"
            className="w-7 h-7 object-contain"
          />
        </picture>
        <div className="flex flex-col">
          <span className="font-bold text-xs uppercase tracking-tight text-white leading-tight">
            Toy Creator
          </span>
          <span className="text-[9px] font-semibold text-zinc-400 uppercase tracking-widest leading-none">
            by ProducerToy
          </span>
        </div>
      </div>
      <div className="flex justify-end z-20">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label="Toggle navigation menu"
          className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-[#1f1f1f] transition"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{
              duration: 0.25,
              ease: "easeInOut",
            }}
            className={cn(
              "fixed h-full w-[280px] sm:w-[320px] max-w-[85vw] inset-y-0 left-0 bg-[#121212] border-r border-[#242424] p-5 z-[100] flex flex-col justify-between shadow-2xl",
              className
            )}
          >
            <div
              className="absolute right-4 top-4 z-50 text-neutral-400 hover:text-white cursor-pointer p-1 rounded-md hover:bg-[#1f1f1f] transition"
              onClick={() => setOpen(false)}
              role="button"
              tabIndex={0}
              aria-label="Close navigation menu"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setOpen(false);
              }}
            >
              <X className="w-5 h-5" />
            </div>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export interface SidebarLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  link: Links;
  className?: string;
  isActive?: boolean;
}

export const SidebarLink = ({
  link,
  className,
  isActive = false,
  onClick,
  ...props
}: SidebarLinkProps) => {
  const { open, animate, setOpen } = useSidebar();

  return (
    <Link
      href={link.href}
      onClick={(e) => {
        if (onClick) onClick(e);
        // On mobile screen sizes, close the sidebar upon click
        if (typeof window !== "undefined" && window.innerWidth < 768) {
          setOpen(false);
        }
      }}
      className={cn(
        "flex items-center justify-start gap-3 group/sidebar px-2.5 py-2 rounded-xl text-xs font-medium transition-colors relative",
        isActive
          ? "bg-[#222222] text-white border border-white/10 shadow-inner"
          : "text-zinc-400 hover:text-white hover:bg-[#181818]",
        className
      )}
      {...props}
    >
      <div className="shrink-0 flex items-center justify-center w-5 h-5">
        {link.icon}
      </div>

      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        transition={{
          duration: 0.15,
        }}
        className={cn(
          "text-xs truncate transition duration-150 whitespace-nowrap inline-block !p-0 !m-0",
          isActive ? "text-white font-semibold" : "text-zinc-400 group-hover/sidebar:text-white"
        )}
      >
        {link.label}
      </motion.span>
    </Link>
  );
};
