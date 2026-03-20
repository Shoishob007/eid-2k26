import { NextResponse } from "next/server";
import { spinForPlayer, getDashboard } from "@/lib/game-service";

export const dynamic = "force-dynamic";

const statusMap = {
    NOT_ALLOWED: 400,
    NOT_FOUND: 404,
    ALREADY_CLAIMED: 409,
    NO_SPINS_LEFT: 409,
    DB_TEMP_UNAVAILABLE: 503,
};

export async function POST(request) {
    try {
        const body = await request.json();
        const name = typeof body.name === "string" ? body.name.trim() : "";
        const power = Number(body.power ?? 68);

        if (!name) {
            return NextResponse.json({ message: "Name is required." }, { status: 400 });
        }

        const normalizedPower = Number.isFinite(power)
            ? Math.min(100, Math.max(30, Math.floor(power)))
            : 68;

        const player = await spinForPlayer({ name, power: normalizedPower });
        const dashboard = await getDashboard(name);

        return NextResponse.json({
            player,
            leaderboard: dashboard.leaderboard,
            players: dashboard.players,
            spin: player.spins[player.spins.length - 1],
        });
    } catch (error) {
        const status = statusMap[error.message] ?? 500;
        return NextResponse.json(
            {
                message: "Spin failed.",
                code: error.message,
            },
            { status },
        );
    }
}
