import { CreateLinks } from "@db/controller/links";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import tzlookup from "tz-lookup";

dayjs.extend(utc);
dayjs.extend(timezone);

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

function extractLinks(text) {
  const linkRegex = /\[([^\]]+)\]/g;
  const links = [];
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    links.push(match[1]);
  }

  return links;
}

export async function replaceAllLinks(emailText, baseDomain) {
  // Extract all links
  const links = extractLinks(emailText);

  // Remove duplicate links
  const uniqueLinks = [...new Set(links)];

  // Call CreateLinks function (assuming it's available in this context)
  const shortenedLinks = await CreateLinks(uniqueLinks);

  // Create a map of original URLs to shortened keys
  const urlToKeyMap = new Map(
    shortenedLinks.map((link) => [link.url, link.key])
  );

  // Replace links in the email text
  let processedText = emailText;
  for (const [originalUrl, key] of urlToKeyMap) {
    const shortUrl = `${baseDomain}/l/${key}`;
    processedText = processedText.replace(
      new RegExp(
        `\\[${originalUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\]`,
        "g"
      ),
      `[${shortUrl}]`
    );
  }

  // Remove double spaces, multiple newlines, and leading/trailing spaces
  processedText = processedText
    .replace(/ +/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Remove any non-ASCII characters
  processedText = processedText.replace(/[^\x00-\x7F]/g, "");

  // Return the modified email text
  return processedText;
}

export const cutLongText = (text: string, maxLength: number): string => {
  if (text.length > maxLength) {
    return `${text.substr(0, maxLength)}...`;
  }
  return text;
};

export const getTimezoneOffset = (
  latitude: number,
  longitude: number
): number => {
  const timezoneName = tzlookup(latitude, longitude);
  const localTime = dayjs().tz(timezoneName);
  const offsetInMinutes = localTime.utcOffset();
  return offsetInMinutes / 60;
};
