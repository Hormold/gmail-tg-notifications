import { LinkShortener } from "@db/model/links";

export async function CreateLinks(
  url: string[]
): Promise<{ key: string; url: string }[]> {
  // Generate key for each link (random, 8 characters a-z0-9A-Z)
  const keys = url.map(() => Math.random().toString(36).substring(2, 10));

  // Create array of objects to insert
  const links = keys.map((key, index) => ({
    key,
    url: url[index],
  }));

  // Insert into database
  await LinkShortener.insertMany(links);

  return links;
}
