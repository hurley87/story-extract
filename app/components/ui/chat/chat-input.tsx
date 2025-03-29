"use client";

import { DocumentFile, useChatUI, useFile } from "@llamaindex/chat-ui";
import { useClientConfig } from "./hooks/use-config";
import { Button } from "../button";
import { Input } from "../input";
import { Loader2 } from "lucide-react";
import { useState } from "react";

// Define the structure for character data
interface CharacterData {
  name: string;
  description: string;
  traits: string[];
}

export default function CustomChatInput() {
  const { requestData, isLoading } = useChatUI();
  const { backend } = useClientConfig();
  const {
    imageUrl,
    uploadFile,
    files,
    removeDoc,
  } = useFile({ uploadAPI: `${backend}/api/chat/upload` });
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState<Record<string, boolean>>({});
  const [extractedData, setExtractedData] = useState<Record<string, CharacterData[]>>({});

  console.log('files', files)

  /**
   * Handles file uploads. Overwrite to hook into the file upload behavior.
   * @param file The file to upload
   */
  const handleUploadFile = async (file: File) => {
    // There's already an image uploaded, only allow one image at a time
    if (imageUrl) {
      alert("You can only upload one image at a time.");
      return;
    }

    try {
      setIsUploading(true);
      // Upload the file and send with it the current request data
      await uploadFile(file, requestData);
    } catch (error: any) {
      // Show error message if upload fails
      alert(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleExtract = async (file: DocumentFile) => {
    try {
      setIsExtracting(prev => ({ ...prev, [file.id]: true }));
      
      const response = await fetch(`${backend}/api/extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId: file.id }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to extract characters');
      }
      
      const data = await response.json();
      setExtractedData(prev => ({ ...prev, [file.id]: data.characters }));
    } catch (error) {
      console.error('Error extracting characters:', error);
      alert('Failed to extract characters. Please try again.');
    } finally {
      setIsExtracting(prev => ({ ...prev, [file.id]: false }));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Input
          type="file"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) handleUploadFile(file);
          }}
          className="flex-1"
          accept=".txt,.pdf,.doc,.docx,.rtf"
          id="file-upload"
        />
        <Button 
          variant="outline" 
          onClick={() => document.getElementById('file-upload')?.click()}
          disabled={isLoading || isUploading}
          className="min-w-[120px]"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            "Upload Story"
          )}
        </Button>
      </div>
      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          {files.map((file) => (
            <div 
              key={file.name}
              className="flex items-center justify-between p-2 rounded-md border bg-background"
            >
              <span className="text-sm truncate">{file.name}</span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleExtract(file)}
                  disabled={isExtracting[file.id]}
                >
                  {isExtracting[file.id] ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Extracting...
                    </>
                  ) : (
                    "Extract"
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => removeDoc(file)}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
          
          {/* Display extracted character data in tables */}
          {Object.entries(extractedData).map(([fileId, characters]) => {
            const file = files.find(f => f.id === fileId);
            if (!file || !characters?.length) return null;
            
            return (
              <div key={`table-${fileId}`} className="mt-4 rounded-md border p-3">
                <h3 className="font-medium text-sm mb-2">Characters from {file.name}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium">Name</th>
                        <th className="text-left py-2 px-3 font-medium">Description</th>
                        <th className="text-left py-2 px-3 font-medium">Personality</th>
                      </tr>
                    </thead>
                    <tbody>
                      {characters.map((character, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-muted/50' : ''}>
                          <td className="py-2 px-3">{character.name}</td>
                          <td className="py-2 px-3">{character.description}</td>
                          <td className="py-2 px-3">
                            {character.traits?.join(', ') || ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
