import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { message } = await request.json();

  if (!message || typeof message !== "string" || !message.trim()) {
    return NextResponse.json(
      { reply: "Please send a message!" },
      { status: 400 }
    );
  }

  const mockResponses = [
    "That's interesting! Tell me more.",
    "I understand. How can I help you further?",
    "Great question! Let me think about that.",
    "I'm here to chat! What else would you like to know?",
    "That sounds wonderful! Anything else on your mind?",
  ];

  const reply = mockResponses[Math.floor(Math.random() * mockResponses.length)];

  await new Promise((resolve) => setTimeout(resolve, 1000));

  return NextResponse.json({ reply });
}

export function GET() {
  return NextResponse.json(
    { reply: "Method not allowed" },
    { status: 405 }
  );
}
