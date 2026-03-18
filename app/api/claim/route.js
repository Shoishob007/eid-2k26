import { NextResponse } from "next/server";
import { claimSpin, getDashboard } from "@/lib/game-service";

export const dynamic = "force-dynamic";

const statusMap = {
    NOT_ALLOWED: 400,
    NOT_FOUND: 404,
    ALREADY_CLAIMED: 409,
    SPIN_NOT_FOUND: 404,
};

export async function POST(request) {
    try {
        const body = await request.json();
        const name = typeof body.name === "string" ? body.name.trim() : "";
        const spinOrder = Number(body.spinOrder);

        if (!name || !Number.isInteger(spinOrder)) {
            return NextResponse.json(
                { message: "Name and spinOrder are required." },
                { status: 400 },
            );
        }

        const player = await claimSpin({ name, spinOrder });
        const dashboard = await getDashboard(name);

        return NextResponse.json({
            player,
            leaderboard: dashboard.leaderboard,
            players: dashboard.players,
        });
    } catch (error) {
        const status = statusMap[error.message] ?? 500;

        return NextResponse.json(
            {
                message: "Claim failed.",
                code: error.message,
            },
            { status },
        );
    }
}
