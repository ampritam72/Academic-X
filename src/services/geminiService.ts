/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Standard model for basic text tasks
const MODEL_NAME = "gemini-3-flash-preview";

export async function generateContent(prompt: string, image?: string, history?: any[]) {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, image, history }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate AI content');
    }

    const data = await response.json();
    return data.text || "";
  } catch (error: any) {
    console.error('Gemini Service Error:', error);
    throw error;
  }
}
