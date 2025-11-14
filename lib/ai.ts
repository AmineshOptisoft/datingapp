export async function chatWithAI(userMessage: string): Promise<string> {
  // Simulate processing delay
  await new Promise((res) => setTimeout(res, 1000));

  // Basic mocked AI reply
  const replies = [
    "That's an interesting thought! Tell me more.",
    "I understand, go on.",
    "Can you elaborate on that?",
    "I see! What else would you like to share?",
    "Thanks for sharing that with me.",
  ];

  return replies[Math.floor(Math.random() * replies.length)];
}
