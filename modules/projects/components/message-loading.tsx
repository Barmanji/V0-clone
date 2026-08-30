import Image from "next/image";
import { useState, useEffect } from "react";

const ShimmerMessages = () => {
  const messages = [
    "Cooking...",
    "Spicing it up...",
    "Hold on fella...",
    "Processing...",
    "Analyzing your prompt....",
    "Love you 3000....",
    "Adding final touches to response....",
    "Almost there....",
  ];

  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % messages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <span className="text-base text-muted-foreground animate-pulse">
        {messages[currentMessageIndex]}
      </span>
    </div>
  );
};

const MessageLoading = () => {
  return (
    <div className="flex flex-col group px-2 pb-4">
      <div
        className="flex items-center gap-2 pl-2 mb-2
        "
      >
        <Image
          src={"/logo.svg"}
          alt="Vibe"
          width={28}
          height={28}
          className="shrink-0 invert dark:invert-0"
        />
      </div>

      <div className="pl-8.5 flex flex-col gap-y-4">
        <ShimmerMessages />
      </div>
    </div>
  );
};

export default MessageLoading;
