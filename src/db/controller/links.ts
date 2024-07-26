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
}
