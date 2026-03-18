import { NextResponse } from "next/server";
import { getDashboard } from "@/lib/game-service";

export const dynamic = "force-dynamic";

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name") ?? undefined;

    try {
        const dashboard = await getDashboard(name);
        return NextResponse.json(dashboard, {
            headers: {
                // Tiny cache window makes toggling snappy without keeping stale data for long.
                "Cache-Control": "public, max-age=3, stale-while-revalidate=15",
            },
        });
    } catch (error) {
        return NextResponse.json(
            { message: "Failed to load dashboard.", detail: error.message },
            { status: 500 },
        );
    }
}
