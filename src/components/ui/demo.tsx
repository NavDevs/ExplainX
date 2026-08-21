"use client";

import React from "react"; 
import { CanvasRevealEffect } from "@/components/ui/canvas-effect";
import { Plus, Send } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export function Chatbot() {
   
  const [hovered, setHovered] = React.useState(false);

  return (
    <div className="h-full w-full">
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative mx-auto w-full h-full flex flex-col items-center justify-center overflow-hidden bg-black"
      >
        <div className="absolute top-4 right-4 z-50 flex gap-2">
          <button id="export-chat-btn" className="text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded">Export</button>
          <button id="clear-chat-btn" className="text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded">Clear</button>
          <button id="explainx-close-btn" className="text-xs bg-red-500/80 hover:bg-red-500 text-white px-2 py-1 rounded">Close</button>
        </div>
        <div className="relative flex w-full h-full flex-col items-center justify-start p-4">
          <AnimatePresence>
            <div className="tracking-tightest flex select-none flex-col py-2 text-center text-3xl font-extrabold leading-none md:flex-col md:text-8xl lg:flex-row"></div>
            {hovered && (
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 1 }}
                className="absolute inset-0 h-full w-full object-cover"
              >
                <CanvasRevealEffect
                  animationSpeed={5}
                  containerClassName="bg-transparent opacity-30 dark:opacity-50"
                  colors={[
                    [245, 5, 55],
                    [245, 5, 55],
                  ]}
                  opacities={[1, 0.8, 1, 0.8, 0.5, 0.8, 1, 0.5, 1, 3]}
                  dotSize={2}
                />
              </motion.div>
            )}
          </AnimatePresence>
          <div className="z-20 w-full">
            <ScrollArea className="h-[360px] w-full overflow-auto p-1">
              <div className="px-6">
                <div className="relative flex h-full w-full justify-center text-center">
                  <h1 className="flex select-none py-2 text-center text-2xl font-extrabold leading-none tracking-tight md:text-2xl lg:text-4xl">
                    <span
                      data-content="AI."
                      className="before:animate-gradient-background-1 relative before:absolute before:bottom-4 before:left-0 before:top-0 before:z-0 before:w-full before:px-2 before:content-[attr(data-content)] sm:before:top-0"
                    >
                      <span className="from-gradient-1-start to-gradient-1-end animate-gradient-foreground-1 bg-gradient-to-r bg-clip-text px-2 text-transparent">
                        AI.
                      </span>
                    </span>
                    <span
                      data-content="Chat."
                      className="before:animate-gradient-background-2 relative before:absolute before:bottom-0 before:left-0 before:top-0 before:z-0 before:w-full before:px-2 before:content-[attr(data-content)] sm:before:top-0"
                    >
                      <span className="from-gradient-2-start to-gradient-2-end animate-gradient-foreground-2 bg-gradient-to-r bg-clip-text px-2 text-transparent">
                        Chat.
                      </span>
                    </span>
                    <span
                      data-content="Experience."
                      className="before:animate-gradient-background-3 relative before:absolute before:bottom-1 before:left-0 before:top-0 before:z-0 before:w-full before:px-2 before:content-[attr(data-content)] sm:before:top-0"
                    >
                      <span className="from-gradient-3-start to-gradient-3-end animate-gradient-foreground-3 bg-gradient-to-r bg-clip-text px-2 text-transparent">
                        Experience.
                      </span>
                    </span>
                  </h1>
                </div>
                <p className="md:text-md lg:text-md mx-auto mt-1 text-center text-xs text-primary/60 md:max-w-2xl">
                  How can I help you today?
                </p>
              </div>
              <div id="react-chat-injection-zone" className="h-full w-full">
                {/* Vanilla JS will inject messages here */}
              </div>
            </ScrollArea>
            <div id="react-input-injection-zone" className="relative mt-2 w-full">
              {/* Vanilla JS will inject the input textarea here */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
