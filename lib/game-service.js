import { prisma } from "@/lib/prisma";
import { allowedNames, MAX_SPINS, pickFlair, pickWeightedSection, participantsSeed } from "@/lib/game-config";

function toPlayerState(player) {
    const spinsLeft = Math.max(player.maxSpins - player.spinsUsed, 0);

    let status = "yet-to-spin";
    if (player.hasClaimed) {
        status = "claimed";
    } else if (player.spinsUsed === 0) {
        status = "yet-to-spin";
    } else if (spinsLeft === 0) {
        status = "exhausted";
    } else {
        status = "in-progress";
    }

    return {
        id: player.id,
        name: player.name,
        isOptional: player.isOptional,
        maxSpins: player.maxSpins,
        spinsUsed: player.spinsUsed,
        spinsLeft,
        hasClaimed: player.hasClaimed,
        claimedAmount: player.claimedAmount,
        claimedSpinOrder: player.claimedSpinOrder,
        claimedAt: player.claimedAt,
        status,
        spins: (player.spins ?? []).map((spin) => ({
            id: spin.id,
            spinOrder: spin.spinOrder,
            amount: spin.amount,
            label: spin.label,
            flair: spin.flair,
            power: spin.power,
            createdAt: spin.createdAt,
        })),
    };
}

export async function ensureParticipantsSeeded() {
    // Upsert all players so changing MAX_SPINS in game-config.js
    // automatically propagates to the DB on the next request.
    await Promise.all(
        participantsSeed.map((player) =>
            prisma.participant.upsert({
                where: { name: player.name },
                create: {
                    name: player.name,
                    isOptional: player.isOptional,
                    maxSpins: MAX_SPINS,
                },
                update: {
                    isOptional: player.isOptional,
                    maxSpins: MAX_SPINS,
                },
            }),
        ),
    );
}

export async function getDashboard(selectedName) {
    await ensureParticipantsSeeded();

    const participants = await prisma.participant.findMany({
        include: {
            spins: {
                orderBy: { spinOrder: "asc" },
            },
        },
        orderBy: { name: "asc" },
    });

    const players = participants.map(toPlayerState);
    const leaderboard = buildLeaderboard(players);

    const selectedPlayer = selectedName
        ? players.find((player) => player.name === selectedName) ?? null
        : null;

    return {
        players,
        leaderboard,
        selectedPlayer,
    };
}

export async function spinForPlayer({ name, power }) {
    if (!allowedNames.has(name)) {
        throw new Error("NOT_ALLOWED");
    }

    await ensureParticipantsSeeded();

    const player = await prisma.participant.findUnique({
        where: { name },
        include: {
            spins: {
                orderBy: { spinOrder: "asc" },
            },
        },
    });

    if (!player) {
        throw new Error("NOT_FOUND");
    }

    if (player.hasClaimed) {
        throw new Error("ALREADY_CLAIMED");
    }

    if (player.spinsUsed >= player.maxSpins) {
        throw new Error("NO_SPINS_LEFT");
    }

    const section = pickWeightedSection();
    const flair = pickFlair();
    const spinOrder = player.spinsUsed + 1;

    await prisma.$transaction([
        prisma.spin.create({
            data: {
                participantId: player.id,
                spinOrder,
                amount: section.amount,
                label: section.label,
                flair,
                power,
            },
        }),
        prisma.participant.update({
            where: { id: player.id },
            data: {
                spinsUsed: {
                    increment: 1,
                },
            },
        }),
    ]);

    const fresh = await prisma.participant.findUnique({
        where: { id: player.id },
        include: {
            spins: {
                orderBy: { spinOrder: "asc" },
            },
        },
    });

    return toPlayerState(fresh);
}

export async function claimSpin({ name, spinOrder }) {
    if (!allowedNames.has(name)) {
        throw new Error("NOT_ALLOWED");
    }

    await ensureParticipantsSeeded();

    const player = await prisma.participant.findUnique({
        where: { name },
        include: {
            spins: {
                orderBy: { spinOrder: "asc" },
            },
        },
    });

    if (!player) {
        throw new Error("NOT_FOUND");
    }

    if (player.hasClaimed) {
        throw new Error("ALREADY_CLAIMED");
    }

    const selectedSpin = player.spins.find((spin) => spin.spinOrder === spinOrder);

    if (!selectedSpin) {
        throw new Error("SPIN_NOT_FOUND");
    }

    await prisma.participant.update({
        where: { id: player.id },
        data: {
            hasClaimed: true,
            claimedAmount: selectedSpin.amount,
            claimedSpinOrder: selectedSpin.spinOrder,
            claimedSpinId: selectedSpin.id,
            claimedAt: new Date(),
        },
    });

    const fresh = await prisma.participant.findUnique({
        where: { id: player.id },
        include: {
            spins: {
                orderBy: { spinOrder: "asc" },
            },
        },
    });

    return toPlayerState(fresh);
}

function buildLeaderboard(players) {
    const sorted = [...players].sort((a, b) => {
        const aAmount = a.claimedAmount ?? -1;
        const bAmount = b.claimedAmount ?? -1;

        if (aAmount !== bAmount) {
            return bAmount - aAmount;
        }

        if (a.spinsUsed !== b.spinsUsed) {
            return b.spinsUsed - a.spinsUsed;
        }

        return a.name.localeCompare(b.name);
    });

    return sorted.map((player, index) => ({
        rank: index + 1,
        name: player.name,
        status: player.status,
        claimedAmount: player.claimedAmount,
        spinsUsed: player.spinsUsed,
        spinsLeft: player.spinsLeft,
        hasClaimed: player.hasClaimed,
        isOptional: player.isOptional,
    }));
}
