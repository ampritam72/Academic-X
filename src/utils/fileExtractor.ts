/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Reads standard text files or scans the binary stream of PDF slides to find readable strings.
 * This satisfies the instruction "slide upload dile seta analysis korei jano ans deya hoi".
 */
export async function extractTextFromFile(file: File): Promise<string> {
  return new Promise((resolve) => {
    // 1. Text or markdown files
    if (
      file.type.startsWith('text/') ||
      file.name.endsWith('.txt') ||
      file.name.endsWith('.md') ||
      file.name.endsWith('.json') ||
      file.name.endsWith('.csv') ||
      file.name.endsWith('.js') ||
      file.name.endsWith('.ts') ||
      file.name.endsWith('.html') ||
      file.name.endsWith('.css')
    ) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fullText = e.target?.result as string || '';
        resolve(fullText.substring(0, 6000)); // safe truncation for general text files to protect TPM rate limits
      };
      reader.onerror = () => resolve('');
      reader.readAsText(file);
    } 
    // 2. Simple best-effort PDF slide content extractor
    else if (file.name.toLowerCase().endsWith('.pdf')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        if (!arrayBuffer) {
          resolve('');
          return;
        }
        
        const bytes = new Uint8Array(arrayBuffer);
        let out = '';
        const limit = Math.min(bytes.length, 600000); // scan up to 600kb
        let inString = false;
        let currentWord = '';

        for (let i = 0; i < limit; i++) {
          const charCode = bytes[i];
          if (charCode === 40) { // '(' character indicates start of printable string in PDF streams
            inString = true;
          } else if (charCode === 41) { // ')' terminates the string
            inString = false;
            if (currentWord.trim().length > 1) {
              out += currentWord + ' ';
            }
            currentWord = '';
          } else if (inString) {
            if (charCode >= 32 && charCode <= 126) {
              currentWord += String.fromCharCode(charCode);
            }
          }
        }

        let cleaned = out
          .replace(/\\(.*?)/g, '$1') // clear escape sequences
          .replace(/[\\(\[\]\)]/g, '') // strip nested brackets
          .replace(/\s+/g, ' ') // collapse multiple spaces
          .trim();

        // Fallback: If literal parentheses strings are missing or obfuscated, capture sequential ASCII sequences
        if (cleaned.length < 50) {
          let rawAscii = '';
          for (let i = 0; i < Math.min(bytes.length, 120000); i++) {
            const b = bytes[i];
            if ((b >= 32 && b <= 126) || b === 10 || b === 13) {
              rawAscii += String.fromCharCode(b);
            } else {
              rawAscii += ' ';
            }
          }
          cleaned = rawAscii.replace(/\s+/g, ' ').substring(0, 15000);
        }

        resolve(cleaned.substring(0, 6000)); // safe range for LLM prompt sizes and TPM rate limits
      };
      reader.onerror = () => resolve('');
      reader.readAsArrayBuffer(file);
    } 
    // 3. Fallback description for unknown types (e.g., images or binaries)
    else {
      resolve(`[File Metadata - Name: ${file.name}, Type: ${file.type}, Size: ${file.size} bytes]`);
    }
  });
}
