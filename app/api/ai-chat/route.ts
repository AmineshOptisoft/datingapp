import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    if (!message) {
      return NextResponse.json(
        { reply: "Please send a message!" },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful dating app assistant." },
        { role: "user", content: message },
      ],
      model: "gpt-3.5-turbo",
      max_tokens: 300,
    });

    const reply =
      completion.choices[0]?.message?.content ||
      "Sorry, I couldn't understand that.";
    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("AI error:", error);
    return NextResponse.json(
      { reply: "AI error. Please try again later." },
      { status: 500 }
    );
  }
}
