"use client";

import { ChatSection as ChatSectionUI } from "@llamaindex/chat-ui";
import "@llamaindex/chat-ui/styles/markdown.css";
import "@llamaindex/chat-ui/styles/pdf.css";
import { useChat } from "ai/react";
import CustomChatInput from "./ui/chat/chat-input";
import CustomChatMessages from "./ui/chat/chat-messages";
import { useClientConfig } from "./ui/chat/hooks/use-config";
import { useState } from "react";

export default function ChatSection() {
  const { backend } = useClientConfig();
  const handler = useChat({
    api: `${backend}/api/chat`,
    onError: (error: unknown) => {
      if (!(error instanceof Error)) throw error;
      let errorMessage: string;
      try {
        errorMessage = JSON.parse(error.message).detail;
      } catch (e) {
        errorMessage = error.message;
      }
      alert(errorMessage);
    },
  });

  const [characterInfo, setCharacterInfo] = useState("");

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const text = await file.text();
      const extractedCharacters = extractCharacters(text);
      setCharacterInfo(extractedCharacters);
    }
  };

  const extractCharacters = (text: string): string => {
    // Placeholder for character extraction logic
    // This function should return a formatted string with character details
    return "Character extraction logic not implemented yet.";
  };

  return (
    <div className="w-full h-full">
      <ChatSectionUI handler={handler}>
        <CustomChatInput />
        {/* <CustomChatMessages /> */}
      </ChatSectionUI>
    </div>
  );
}
