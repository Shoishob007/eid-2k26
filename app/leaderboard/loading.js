export default function LeaderboardLoading() {
    return (
        <main className="app-shell">
            <div className="ambient-layer" />

            <section className="card leaderboard-card">
                <div className="top-row">
                    <div>
                        <div className="skeleton-block skeleton-title" />
                        <div className="skeleton-block skeleton-leader-copy" style={{ marginTop: 10, width: "min(380px, 90%)" }} />
                    </div>
                    <div className="skeleton-block skeleton-icon" />
                </div>

                <div className="leaderboard-list">
                    {new Array(8).fill(null).map((_, idx) => (
                        <div key={idx} className="leader-row skeleton-row">
                            <span className="leader-rank skeleton-rank" />
                            <div className="leader-main">
                                <span className="skeleton-block skeleton-leader-name" />
                                <span className="skeleton-block skeleton-leader-copy" />
                            </div>
                            <span className="leader-state skeleton-state" />
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
}
