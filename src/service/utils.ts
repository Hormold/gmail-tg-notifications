import dayjs from "dayjs";

const emailRegex = /(?:<?\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b>?)/i;
export const extractEmail = (input: string): string | null => {
  const match = input.match(emailRegex);
  if (match) {
    // Remove < > if present
    return match[0].replace(/[<>]/g, "");
  }
  return null;
};

// Remove all tags from string, but leave content
export const clearTags = (input: string): string => {
  return input.replace(/<[^>]*>/g, "");
};

export const escapeHTML = (text: string): string => {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export const isValidUrl = (url: string): boolean => {
  try {
    const newUrl = new URL(url);
    return newUrl.protocol === "http:" || newUrl.protocol === "https:";
  } catch (err) {
    return false;
  }
};

export const extractUnsubscribeUrl = (header: string): string | null => {
  const urlRegex = /<(https?:\/\/[^>]+)>/;
  const matches = header.match(urlRegex);
  if (matches && matches.length > 1) {
    return matches[1];
  }
  return null;
};
