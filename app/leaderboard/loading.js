import LeaderboardSkeletonRows from "@/app/components/leaderboard-skeleton";

const lanterns = [
    { id: 1, left: "6%" },
    { id: 2, left: "28%" },
    { id: 3, left: "54%" },
    { id: 4, left: "76%" },
    { id: 5, left: "91%" },
];

export default function LeaderboardLoading() {
    return (
        <main className="app-shell">
            <div className="ambient-layer" />
            <div className="lantern-row" aria-hidden>
                {lanterns.map((lantern) => (
                    <span key={lantern.id} className="lantern" style={{ left: lantern.left }} />
                ))}
            </div>

            <section className="card leaderboard-card">
                <div className="top-row">
                    <div>
                        <div className="skeleton-block skeleton-kicker" />
                        <div className="skeleton-block skeleton-title" />
                        <div className="skeleton-block skeleton-leader-copy" style={{ marginTop: 10, width: "min(380px, 90%)" }} />
                    </div>
                    <div className="skeleton-block skeleton-icon" />
                </div>

                <LeaderboardSkeletonRows />
            </section>
        </main>
    );
}
