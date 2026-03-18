export default function Loading() {
    return (
        <main className="app-shell">
            <div className="ambient-layer" />

            <section className="card spin-card">
                <div className="top-row">
                    <div className="skeleton-block skeleton-title" />
                    <div className="skeleton-block skeleton-icon" />
                </div>

                <div className="skeleton-stack">
                    <div className="skeleton-block skeleton-input" />
                    <div className="skeleton-block skeleton-pill-row" />
                    <div className="skeleton-block skeleton-input" />
                </div>

                <div className="wheel-skeleton-wrap">
                    <div className="skeleton-wheel" />
                </div>

                <div className="skeleton-block skeleton-button" />
            </section>
        </main>
    );
}
