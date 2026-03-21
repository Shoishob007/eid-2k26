import { PrismaClient } from "@prisma/client";

const MAX_SPINS = 5;
const participantsSeed = [
    { name: "Ifty", isOptional: false },
    { name: "Diya", isOptional: false },
    { name: "Anaita", isOptional: false },
    { name: "Ornoba", isOptional: false },
    { name: "Raisa", isOptional: false },
    { name: "Elma", isOptional: false },
    { name: "Prerona", isOptional: false },
    { name: "Purnota", isOptional: false },
    { name: "Towhid", isOptional: false },
    { name: "Ratul", isOptional: true },
];

const prisma = new PrismaClient();

async function main() {
    await prisma.$transaction([
        prisma.spin.deleteMany(),
        prisma.participant.deleteMany(),
        prisma.participant.createMany({
            data: participantsSeed.map((player) => ({
                name: player.name,
                isOptional: player.isOptional,
                maxSpins: MAX_SPINS,
                spinsUsed: 0,
                hasClaimed: false,
                claimedAmount: null,
                claimedSpinOrder: null,
                claimedSpinId: null,
                claimedAt: null,
            })),
        }),
    ]);

    console.log("Game data reset complete.");
}

main()
    .catch((error) => {
        console.error("Failed to reset game data.");
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
