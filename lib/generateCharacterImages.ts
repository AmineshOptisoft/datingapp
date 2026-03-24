import path from "path";
import fs from "fs";

/**
 * Generate 5 diverse images for a character using Grok API,
 * download them locally (Grok URLs expire in ~1-2 hours),
 * and update the character's generatedImages field in the DB.
 *
 * This runs as fire-and-forget after character creation.
 */

interface CharacterAttrs {
  characterName: string;
  characterAge: number;
  characterGender: "male" | "female" | "other";
  personality: string;
  description: string;
}

/**
 * Build 5 distinct prompts based on character attributes.
 */
function buildPrompts(attrs: CharacterAttrs): string[] {
  const { characterName, characterAge, characterGender, personality, description } = attrs;

  const genderWord =
    characterGender === "male"
      ? "man"
      : characterGender === "female"
      ? "woman"
      : "person";

  const base = `A ${characterAge}-year-old ${genderWord} named ${characterName}. ${description}. Personality: ${personality}.`;

  return [
    // 1 — Portrait / Close-up
    `${base} A stunning close-up portrait photograph, soft studio lighting, shallow depth of field, expressive eyes, photorealistic, high quality.`,

    // 2 — Lifestyle / Casual
    `${base} Casual lifestyle photograph in a cozy café setting, warm natural lighting, relaxed candid pose, photorealistic, high quality.`,

    // 3 — Fashion / Full-body
    `${base} Full-body fashion photograph, stylish modern outfit that matches their personality, urban street background, photorealistic, high quality.`,

    // 4 — Mood / Emotional
    `${base} Emotional portrait expressing their personality, cinematic lighting, dramatic mood, depth of field, photorealistic, high quality.`,

    // 5 — Activity / Scene
    `${base} Engaged in an activity that reflects their personality and interests, dynamic composition, natural environment, photorealistic, high quality.`,
  ];
}

/**
 * Download an image from a URL and save it locally to /public/uploads/.
 * Returns the local API path like /api/uploads/chargen-xxx.jpg
 */
async function downloadAndSave(imageUrl: string, index: number): Promise<string> {
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const uniqueName = `chargen-${Date.now()}-${index}-${Math.round(Math.random() * 1e6)}.jpg`;
  const filePath = path.join(uploadsDir, uniqueName);

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  fs.writeFileSync(filePath, Buffer.from(arrayBuffer));

  return `/api/uploads/${uniqueName}`;
}

/**
 * Main entry — generates 5 images, saves locally, updates DB.
 */
export async function generateCharacterImages(
  userId: string,
  characterId: string,
  attrs: CharacterAttrs
): Promise<void> {
  const grokApiKey = process.env.GROK_API_KEY;
  if (!grokApiKey) {
    console.error("❌ [CharGen] GROK_API_KEY not found, skipping image generation");
    return;
  }

  const prompts = buildPrompts(attrs);
  const savedUrls: string[] = [];

  console.log(`🎨 [CharGen] Generating 5 images for character ${attrs.characterName}…`);

  for (let i = 0; i < prompts.length; i++) {
    try {
      console.log(`🎨 [CharGen] Generating image ${i + 1}/5…`);

      const grokResponse = await fetch("https://api.x.ai/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${grokApiKey}`,
        },
        body: JSON.stringify({
          model: "grok-imagine-image",
          prompt: prompts[i],
          n: 1,
        }),
      });

      if (!grokResponse.ok) {
        const errData = await grokResponse.json().catch(() => ({}));
        console.error(`❌ [CharGen] Grok API error for image ${i + 1}:`, grokResponse.status, errData);
        continue; // skip this one, try remaining
      }

      const grokData = await grokResponse.json();
      const imageUrl = grokData.data?.[0]?.url || grokData.url;

      if (!imageUrl) {
        console.error(`❌ [CharGen] No URL in Grok response for image ${i + 1}`);
        continue;
      }

      // Download and save locally so it doesn't expire
      const localUrl = await downloadAndSave(imageUrl, i);
      savedUrls.push(localUrl);
      console.log(`✅ [CharGen] Image ${i + 1}/5 saved: ${localUrl}`);
    } catch (err) {
      console.error(`❌ [CharGen] Error generating image ${i + 1}:`, err);
      // continue with next image
    }
  }

  if (savedUrls.length === 0) {
    console.error("❌ [CharGen] No images were generated successfully");
    return;
  }

  // Update the character in DB
  try {
    const dbConnect = (await import("@/lib/db")).default;
    const User = (await import("@/models/User")).default;

    await dbConnect();

    await User.updateOne(
      { _id: userId, "characters._id": characterId },
      { $set: { "characters.$.generatedImages": savedUrls } }
    );

    console.log(`💾 [CharGen] Saved ${savedUrls.length} images for character ${characterId}`);
  } catch (dbErr) {
    console.error("❌ [CharGen] Failed to update character with generated images:", dbErr);
  }
}
