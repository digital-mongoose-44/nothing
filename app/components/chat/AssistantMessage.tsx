/**
 * AssistantMessage.tsx - Assistant Message Component
 *
 * Renders assistant messages with Vercel AI Chatbot styling:
 * - Left-aligned with sparkle avatar badge
 * - Light background
 * - Supports radio player, error displays, and loading states
 */
"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { ParsedContent, RadioUIElement, ParseError, APIError } from "../../types/ui-elements";
import { AudioPlayer } from "../AudioPlayer";
import { AudioPlayerSkeleton } from "../AudioPlayerSkeleton";

// ============================================================================
// ERROR DISPLAY COMPONENTS
// ============================================================================

function UIElementError({ error }: { error: ParseError }) {
  return (
    <div
      className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-200 dark:bg-amber-800">
          <svg
            className="h-4 w-4 text-amber-700 dark:text-amber-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Unable to display content
          </p>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
            {error.message}
          </p>
          {error.rawContent && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200">
                Show raw data
              </summary>
              <pre className="mt-1 overflow-x-auto rounded bg-amber-100 p-2 text-xs text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                {error.rawContent}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

function APIErrorDisplay({ error }: { error: APIError }) {
  const getErrorIcon = () => {
    switch (error.type) {
      case "not_found":
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        );
      case "server_error":
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        );
      case "network_error":
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
          />
        );
    }
  };

  const getTitle = () => {
    switch (error.type) {
      case "not_found":
        return "Incident Not Found";
      case "server_error":
        return "Server Error";
      case "network_error":
        return "Connection Error";
    }
  };

  const getSuggestion = () => {
    switch (error.type) {
      case "not_found":
        return "Please verify the incident number and try again.";
      case "server_error":
        return "The server encountered an error. Please try again later.";
      case "network_error":
        return "Please check your internet connection and try again.";
    }
  };

  return (
    <div
      className="mt-3 rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-red-200 dark:bg-red-900">
          <svg
            className="h-4 w-4 text-red-700 dark:text-red-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            {getErrorIcon()}
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">
            {getTitle()}
          </p>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">
            {error.message}
          </p>
          {error.incidentId && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              Incident ID: {error.incidentId}
            </p>
          )}
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {getSuggestion()}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface AssistantMessageProps {
  content: string;
  parsedContent?: ParsedContent;
}

export const AssistantMessage = memo(function AssistantMessage({
  content,
  parsedContent,
}: AssistantMessageProps) {
  // Extract content from parsed message
  const radioElements =
    parsedContent?.uiElements.filter(
      (el): el is RadioUIElement => el.type === "radio"
    ) ?? [];
  const parseErrors = parsedContent?.errors ?? [];
  const apiError = parsedContent?.apiError;
  const isLoading = parsedContent?.isLoading ?? false;
  const displayText = parsedContent?.text ?? content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex justify-start gap-3"
    >
      {/* Avatar badge */}
      <Avatar className="h-8 w-8 shrink-0 ring-1 ring-border">
        <AvatarFallback className="bg-gradient-to-br from-violet-500 to-pink-500">
          <Sparkles className="h-4 w-4 text-white" />
        </AvatarFallback>
      </Avatar>

      {/* Message content */}
      <div
        className={cn(
          "max-w-[calc(100%-3rem)] sm:max-w-[80%]",
          "rounded-2xl px-4 py-2.5",
          "bg-secondary text-secondary-foreground"
        )}
      >
        {/* Text content */}
        {displayText && (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{displayText}</p>
        )}

        {/* Loading skeleton */}
        {isLoading && <AudioPlayerSkeleton />}

        {/* Audio players */}
        {!isLoading &&
          radioElements.map((element, index) => (
            <AudioPlayer key={index} payload={element.payload} />
          ))}

        {/* Parse errors */}
        {parseErrors.map((error, index) => (
          <UIElementError key={`error-${index}`} error={error} />
        ))}

        {/* API errors */}
        {apiError && <APIErrorDisplay error={apiError} />}
      </div>
    </motion.div>
  );
});

AssistantMessage.displayName = "AssistantMessage";
