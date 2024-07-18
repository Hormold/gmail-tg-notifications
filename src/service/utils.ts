const emailRegex = /(?:<?\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b>?)/i;

export const extractEmail = (input: string): string | null => {
  const match = input.match(emailRegex);
  if (match) {
    // Remove < > if present
    return match[0].replace(/[<>]/g, "");
  }
  return null;
};
