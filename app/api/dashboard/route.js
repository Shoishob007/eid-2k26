import { NextResponse } from "next/server";
import { getDashboard } from "@/lib/game-service";

export const dynamic = "force-dynamic";

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name") ?? undefined;

    try {
        const dashboard = await getDashboard(name);
        return NextResponse.json(dashboard);
    } catch (error) {
        return NextResponse.json(
            { message: "Failed to load dashboard.", detail: error.message },
            { status: 500 },
        );
    }
}
