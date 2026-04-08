import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "node:path";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  const phrases = [
    { text: "Need Water", icon: "water_drop", category: "needs", priority: "high" },
    { text: "Feeling Hungry", icon: "restaurant", category: "needs", priority: "medium" },
    { text: "Bathroom", icon: "wc", category: "needs", priority: "high" },
    { text: "Happy", icon: "sentiment_very_satisfied", category: "social", priority: "medium" },
    { text: "Please Repeat", icon: "replay", category: "needs", priority: "medium" },
    { text: "Help", icon: "emergency", category: "needs", priority: "essential" },
    { text: "Medicine", icon: "medical_services", category: "needs", priority: "high" },
    { text: "Tired", icon: "bedtime", category: "needs", priority: "medium" },
    { text: "Hello there", icon: "waving_hand", category: "social", priority: "medium" },
    { text: "Thank you", icon: "favorite", category: "social", priority: "medium" },
    { text: "I am happy", icon: "sentiment_very_satisfied", category: "social", priority: "medium" },
    { text: "How are you?", icon: "question_mark", category: "social", priority: "medium" },
    { text: "I need water", icon: "water_drop", category: "needs", priority: "high" },
    { text: "I am hungry", icon: "restaurant", category: "needs", priority: "medium" },
    { text: "Time for medicine", icon: "medication", category: "needs", priority: "essential" },
    { text: "I need to rest", icon: "bed", category: "needs", priority: "medium" },
  ];

  for (const phrase of phrases) {
    await prisma.phrase.create({ data: phrase });
  }

  await prisma.emergencyContact.create({
    data: { name: "Sarah Jenkins", role: "Care Manager", phone: "+1 (555) 012-3456", isPrimary: true },
  });

  await prisma.userSettings.create({
    data: { id: "default", voiceId: "default", speechRate: 1.0, theme: "light" },
  });

  const now = new Date();
  const yesterday = new Date(now.getTime() - 86400000);

  await prisma.historyEntry.createMany({
    data: [
      { text: "Could you please help me find my reading glasses?", category: "needs", source: "typed", spokenAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 32) },
      { text: "Thank you for the wonderful meal, it was delicious.", category: "social", source: "typed", spokenAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 15) },
      { text: "I am feeling quite tired, I think I'll rest now.", category: "needs", source: "tile", spokenAt: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 18, 45), favorited: true },
      { text: "I would like some cold water with lemon, please.", category: "needs", source: "tile", spokenAt: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 9, 20) },
    ],
  });

  console.log("Seed data created successfully!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
