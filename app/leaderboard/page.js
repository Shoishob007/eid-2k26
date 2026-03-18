"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import FlipToggleNav from "@/app/components/flip-toggle-nav";

const lanterns = [
    { id: 1, left: "6%", delay: 0 },
    { id: 2, left: "28%", delay: 0.22 },
    { id: 3, left: "54%", delay: 0.11 },
    { id: 4, left: "76%", delay: 0.3 },
    { id: 5, left: "91%", delay: 0.17 },
];

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        async function loadLeaderboard() {
            setIsLoading(true);

            try {
                const response = await fetch("/api/dashboard", { cache: "no-store" });

                if (!response.ok) {
                    throw new Error("LOAD_FAILED");
                }

                const data = await response.json();
                setLeaderboard(data.leaderboard ?? []);
                setErrorMessage("");
            } catch (error) {
                setErrorMessage("Could not load leaderboard right now.");
            } finally {
                setIsLoading(false);
            }
        }

        void loadLeaderboard();
    }, []);

    return (
        <main className="app-shell">
            <div className="ambient-layer" />
            <div className="lantern-row" aria-hidden>
                {lanterns.map((lantern) => (
                    <motion.span
                        key={lantern.id}
                        className="lantern"
                        style={{ left: lantern.left }}
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 2.8, repeat: Infinity, delay: lantern.delay }}
                    />
                ))}
            </div>

            <motion.section
                className="card leaderboard-card"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.22 }}
            >
                <div className="top-row">
                    <div>
                        <p className="kicker">Eid Ranking</p>
                        <h1 className="panel-title">Leaderboard</h1>
                        <p className="tiny-copy">Claimed amounts, active players, and who is still waiting for fate.</p>
                    </div>
                    <FlipToggleNav to="/?view=spinner" label="Flip to spinner" />
                </div>

                {isLoading ? (
                    <div className="leaderboard-list">
                        {new Array(6).fill(null).map((_, idx) => (
                            <div key={idx} className="leader-row">
                                <span className="leader-rank skeleton-block" />
                                <div className="leader-main">
                                    <span className="skeleton-block skeleton-leader-name" />
                                    <span className="skeleton-block skeleton-leader-copy" />
                                </div>
                                <span className="leader-state skeleton-block" />
                            </div>
                        ))}
                    </div>
                ) : null}
                {errorMessage ? <p className="status-note error">{errorMessage}</p> : null}

                {!isLoading && !errorMessage ? (
                    <div className="leaderboard-list">
                        {leaderboard.map((entry) => (
                            <div key={entry.name} className="leader-row">
                                <span className="leader-rank">#{entry.rank}</span>
                                <div className="leader-main">
                                    <strong>
                                        {entry.name}
                                        {entry.isOptional ? " (Optional)" : ""}
                                    </strong>
                                    <span>
                                        {entry.hasClaimed
                                            ? `Claimed ৳${entry.claimedAmount}`
                                            : entry.status === "yet-to-spin"
                                                ? "Yet to spin"
                                                : entry.status === "exhausted"
                                                    ? "Out of spins"
                                                    : `In progress (${entry.spinsUsed}/${entry.spinsLeft + entry.spinsUsed})`}
                                    </span>
                                </div>
                                <span className={`leader-state status-${entry.status}`}>{entry.status}</span>
                            </div>
                        ))}
                    </div>
                ) : null}
            </motion.section>
        </main>
    );
}