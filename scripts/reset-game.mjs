import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    await prisma.$transaction([
        prisma.spin.deleteMany(),
        prisma.participant.updateMany({
            data: {
                spinsUsed: 0,
                hasClaimed: false,
                claimedAmount: null,
                claimedSpinOrder: null,
                claimedSpinId: null,
                claimedAt: null,
            },
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
