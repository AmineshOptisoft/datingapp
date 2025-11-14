import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.status(405).json({ reply: "Method not allowed" });
    return;
  }

  const { message } = req.body;

  if (!message || message.trim() === "") {
    res.status(400).json({ reply: "Please send a message!" });
    return;
  }

  // Simulated AI response - replace with real AI call if needed
  const mockResponses = [
    "That's interesting! Tell me more.",
    "I understand. How can I help you further?",
    "Great question! Let me think about that.",
    "I'm here to chat! What else would you like to know?",
    "That sounds wonderful! Anything else on your mind?",
  ];

  const reply = mockResponses[Math.floor(Math.random() * mockResponses.length)];

  // Simulate delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  res.status(200).json({ reply });
}
