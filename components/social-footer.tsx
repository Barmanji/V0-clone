"use client";

import { Show } from "@clerk/nextjs";
import { RiGithubFill, RiLinkedinBoxFill, RiGlobalLine, RiMailLine } from "@remixicon/react";

const socialLinks = [
  { name: "GitHub", url: "https://github.com/barmanji", icon: RiGithubFill },
  { name: "LinkedIn", url: "https://www.linkedin.com/in/ajay-barman-0b37011a7/", icon: RiLinkedinBoxFill },
  { name: "Email", url: "mailto:barmanjiaj@gmail.com", icon: RiMailLine },
];

export const SocialFooter = () => {
  return (
    <Show when="signed-out">
      <footer className="fixed bottom-6 left-0 right-0 flex flex-col justify-center items-center gap-3 text-muted-foreground z-40">
        <p className="text-xs tracking-wide">
          Made with ❤️ by{" "}
          <a
            href="https://www.barmanji.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors duration-200 font-medium underline underline-offset-2"
          >
            Barmanji
          </a>
        </p>
        <div className="flex items-center gap-6">
          {socialLinks.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              title={link.name}
              className="hover:text-foreground transition-colors duration-200 cursor-pointer"
            >
              <link.icon size={20} />
            </a>
          ))}
        </div>
      </footer>
    </Show>
  );
};
