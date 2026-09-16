import React, { useState } from "react";
import { ExternalLink, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Fragment } from "@/lib/generated/prisma/client";

interface FragmentWebProps {
  data: Fragment;
}

const FragmentWeb = ({ data }: FragmentWebProps) => {
  const [fragmentKey, setFragmentKey] = useState(0);
  const [copied, setCopied] = useState(false);

  const onRefresh = () => {
    setFragmentKey((prev) => prev + 1);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(data.sandboxUrl);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col w-full h-full">
      <div className="p-2 border-b bg-sidebar flex items-center gap-x-2">
        <Tooltip>
          <TooltipTrigger >
            <Button size={"sm"} variant={"outline"} onClick={onRefresh}>
              <RefreshCcw />
            </Button>
          </TooltipTrigger>
          <TooltipContent side={"bottom"} align={"start"}>
            <p>Refresh</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger >
            <Button
              size={"sm"}
              variant={"outline"}
              onClick={handleCopy}
              disabled={!data.sandboxUrl || copied}
              className={"flex-1 justify-start text-start font-normal"}
            >
              <span className="truncate">{data.sandboxUrl}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side={"bottom"} align={"start"}>
            <p>{copied ? "Copied" : "Click to copy"}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger >
            <Button
              size={"sm"}
              variant={"outline"}
              onClick={() => {
                if (!data.sandboxUrl) return;
                window.open(data.sandboxUrl, "_blank");
              }}
            >
              <ExternalLink />
            </Button>
          </TooltipTrigger>
          <TooltipContent side={"bottom"} align={"start"}>
            <p>Open in new tab</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <iframe
        key={fragmentKey}
        className="h-full w-full"
        sandbox="allow-scripts allow-same-origin allow-scripts"
        loading="lazy"
        src={data.sandboxUrl.replace(/^http:/, "https:")}
      />
    </div>
  );
};

export default FragmentWeb;
