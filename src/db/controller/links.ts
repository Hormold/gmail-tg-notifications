import { LinkShortener } from "@db/model/links";

export async function CreateLinks(
  url: string[],
  ttl?: Date
): Promise<{ key: string; url: string }[]> {
  const toReturn: { key: string; url: string }[] = [];
  // Check all urls in DB first
  const existingLinks = await LinkShortener.find({
    url: { $in: url },
  });

  // Remove existing links from the list
  const newUrls = url.filter(
    (url) => !existingLinks.find((link) => link.url === url)
  );

  // Generate key for each link (random, 8 characters a-z0-9A-Z)
  const keys = newUrls.map(() => Math.random().toString(36).substring(2, 10));

  // Create array of objects to insert
  const links = keys.map((key, index) => ({
    key,
    url: newUrls[index],
    ttl,
  }));

  // Insert into database
  const creationResult = await LinkShortener.insertMany(links);

  // Return all links
  toReturn.push(
    ...creationResult.map((link) => ({
      key: link.key,
      url: link.url,
    }))
  );

  // Return existing links as well
  toReturn.push(
    ...existingLinks.map((link) => ({
      key: link.key,
      url: link.url,
    }))
  );

  return toReturn;
}

export async function GetLinkByKey(key: string): Promise<string | null> {
  const link = await LinkShortener.findOne(
    {
      key,
    },
    { url: 1 }
  );

  return link ? link.url : null;
}

export async function CleanUpAfterMonth() {
  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  await LinkShortener.deleteMany({
    createdAt: { $lte: monthAgo },
  });

  // Or clean up by TTL
  await LinkShortener.deleteMany({
    ttl: { $lte: new Date() },
  });
}
