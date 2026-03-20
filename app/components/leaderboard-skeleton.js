import { participantsSeed } from "@/lib/game-config";

const skeletonRows = participantsSeed.length;

export default function LeaderboardSkeletonRows() {
    return (
        <div className="leaderboard-list" aria-hidden>
            {new Array(skeletonRows).fill(null).map((_, idx) => (
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
    );
}
