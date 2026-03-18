import { NextResponse } from "next/server";

export async function GET() {
  const dummyMessages = [
    {
      id: 1,
      name: "Aarav Sharma",
      message: "Hey, are we still meeting for coffee tomorrow?",
      image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop"
    },
    {
      id: 2,
      name: "Sophia Martinez",
      message: "I just finished reading that book you recommended. It was amazing!",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop"
    },
    {
      id: 3,
      name: "Liam Chen",
      message: "Can you send me the files from yesterday's meeting?",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop"
    },
    {
      id: 4,
      name: "Emma Wilson",
      message: "Happy birthday! Hope you have a wonderful day.",
      image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop"
    },
    {
      id: 5,
      name: "Noah Davis",
      message: "The game last night was crazy! Did you catch the highlights?",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop"
    },
    {
      id: 6,
      name: "Isabella Garcia",
      message: "Let me know when you're free to hop on a quick call.",
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop"
    },
    {
      id: 7,
      name: "Mason Taylor",
      message: "I'm running about 10 minutes late. Save me a seat!",
      image: "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=400&h=400&fit=crop"
    },
    {
      id: 8,
      name: "Mia Anderson",
      message: "Thanks for helping me figure out that bug.",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop"
    },
    {
      id: 9,
      name: "Ethan Thomas",
      message: "Bro, check out this new track I just made.",
      image: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&h=400&fit=crop"
    },
    {
      id: 10,
      name: "Amelia Jackson",
      message: "Are we still doing movie night this weekend?",
      image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop"
    },
    {
      id: 11,
      name: "Lucas White",
      message: "Just got the new PS5! Come over and let's play.",
      image: "https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400&h=400&fit=crop"
    },
    {
      id: 12,
      name: "Harper Harris",
      message: "Do you have the recipe for that pasta dish you made?",
      image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop"
    },
    {
      id: 13,
      name: "Alexander Martin",
      message: "I'll review the pull request by end of day.",
      image: "https://images.unsplash.com/photo-1488161628813-04466f872be2?w=400&h=400&fit=crop"
    },
    {
      id: 14,
      name: "Evelyn Thompson",
      message: "So proud of you! Congratulations on the promotion.",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop"
    },
    {
      id: 15,
      name: "Elijah Garcia",
      message: "Is the gym open tomorrow morning?",
      image: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=400&h=400&fit=crop"
    },
    {
      id: 16,
      name: "Abigail Robinson",
      message: "I loved the restaurant we went to! We should go again.",
      image: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&h=400&fit=crop"
    },
    {
      id: 17,
      name: "James Clark",
      message: "Any updates on the ongoing project status?",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop"
    },
    {
      id: 18,
      name: "Emily Rodriguez",
      message: "Don't forget to grab some milk on your way back.",
      image: "https://images.unsplash.com/photo-1517365830460-955ce3ccd263?w=400&h=400&fit=crop"
    },
    {
      id: 19,
      name: "Benjamin Lewis",
      message: "Hit me up when you're online.",
      image: "https://images.unsplash.com/photo-1530268729831-4b0b9e170218?w=400&h=400&fit=crop"
    },
    {
      id: 20,
      name: "Charlotte Lee",
      message: "Did you finish the assignment for science class?",
      image: "https://images.unsplash.com/photo-1548142813-c348350df52b?w=400&h=400&fit=crop"
    }
  ];

  return NextResponse.json({
    success: true,
    data: dummyMessages
  });
}
