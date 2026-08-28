import Image from "next/image";
import Link from "next/link";
import React from "react";
import { SignInButton, SignUpButton, UserButton, Show } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";

// import { useScroll } from "@/hooks/use-scroll";
import { cn } from "@/lib/utils";


export const Navbar = () => {
    // const isScrolled = useScroll();

  return (
    <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-5xl px-4">
      <div className="bg-teal-50/10 dark:bg-teal-950/10 backdrop-blur-md border border-teal-200/20 dark:border-teal-800/10 rounded-2xl shadow-lg shadow-teal-900/5 dark:shadow-teal-900/20 transition-all duration-200 hover:bg-teal-50/15 dark:hover:bg-teal-950/15">
        <div className="px-6 py-4 flex justify-between items-center">
          <Link href={"/"} className="flex items-center gap-2">
            <span className="font-bold text-2xl tracking-widest text-teal-300">
              V0-clone
            </span>
          </Link>


          <div className="flex items-center gap-4">
            <ModeToggle/>
            {/* <Show when={"signed-in"}> */}
            {/*   <UserButton/> */}
            {/* </Show> */}

            <Show when={"signed-out"}>
              <SignInButton>
                <Button
                  size="sm"
                  className="cursor-pointer text-sm font-medium bg-white text-teal-600 hover:bg-teal-50 hover:text-teal-700 border border-teal-400"
                >
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton>
                <Button
                  size="sm"
                  className="cursor-pointer text-sm font-medium bg-teal-500 hover:bg-teal-600 text-white"
                >
                  Sign Up
                </Button>
              </SignUpButton>
            </Show>
          </div>
        </div>
      </div>
    </nav>
  );
};
