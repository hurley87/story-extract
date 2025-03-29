import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import OpenAI from "openai";
import { UPLOADED_FOLDER } from "../chat/llamaindex/documents/helper";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Character schema for structured output
const characterSchema = {
  type: "object",
  properties: {
    characters: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "The name of the character"
          },
          description: {
            type: "string",
            description: "A detailed physical and background description of the character"
          },
          traits: {
            type: "array",
            items: {
              type: "string"
            },
            description: "Key personality traits and characteristics of the character"
          }
        },
        required: ["name", "description", "traits"],
        additionalProperties: false
      }
    }
  },
  required: ["characters"],
  additionalProperties: false
};

async function findFileById(fileId: string) {
  try {
    const files = await fs.readdir(UPLOADED_FOLDER);
    for (const file of files) {
      if (file.includes(fileId)) {
        return path.join(UPLOADED_FOLDER, file);
      }
    }
    return null;
  } catch (error) {
    console.error("Error finding file:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { fileId } = await request.json();
    
    if (!fileId) {
      return NextResponse.json(
        { error: "fileId is required in the request body" },
        { status: 400 }
      );
    }

    // Find the file path
    const filePath = await findFileById(fileId);
    
    if (!filePath) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // Read the file content
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    // Extract characters using OpenAI Responses API
    const response = await openai.responses.create({
      model: "gpt-4o-2024-08-06",
      input: [
        {
          role: "system",
          content: "You are a literary analysis expert who extracts character information from stories. Extract all main characters with their name, description, and personality traits in a structured format."
        },
        {
          role: "user",
          content: `Extract all the main characters from the following story. For each character, provide their name, a detailed description (including physical attributes and background), and key personality traits.\n\nHere's the story:\n${fileContent}`
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "character_extraction",
          schema: characterSchema,
          strict: true
        }
      },
      temperature: 0.7,
    });

    if (!response.output_text) {
      return NextResponse.json(
        { error: "Failed to extract characters from story" },
        { status: 500 }
      );
    }

    const characters = JSON.parse(response.output_text);
    return NextResponse.json(characters);
  } catch (error) {
    console.error("[Extract API]", error);
    
    let errorMessage = "An error occurred during character extraction";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 