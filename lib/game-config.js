export const giverName = "Shoishob";

// ── Change this ONE value to update the spin limit for all players. ──────────
export const MAX_SPINS = 10;

export const participantsSeed = [
    { name: "Ifty", isOptional: false },
    { name: "Diya", isOptional: false },
    { name: "Anaita", isOptional: false },
    { name: "Ornoba", isOptional: false },
    { name: "Raisa", isOptional: false },
    { name: "Elma", isOptional: false },
    { name: "Prerona", isOptional: false },
    { name: "Purnota", isOptional: false },
    { name: "Towhid", isOptional: false },
    { name: "Ratul", isOptional: true },
];

export const allowedNames = new Set(participantsSeed.map((player) => player.name));

export const wheelSections = [
    { label: "2", amount: 2, color: "#0f6a53", weight: 10 },
    { label: "5", amount: 5, color: "#2f9f7f", weight: 10 },
    { label: "10", amount: 10, color: "#d19a2a", weight: 10 },
    { label: "20", amount: 20, color: "#d1603d", weight: 10 },
    { label: "30", amount: 30, color: "#d84b55", weight: 10 },
    { label: "50", amount: 50, color: "#6c4aa9", weight: 10 },
    { label: "100", amount: 100, color: "#2a5fbc", weight: 3 },
];

export const flairWords = ["Blessed", "Mubarak", "Joyful", "Golden", "Sparkling"];

export function pickWeightedSection() {
    const totalWeight = wheelSections.reduce((sum, section) => sum + section.weight, 0);
    let randomPoint = Math.random() * totalWeight;

    for (const section of wheelSections) {
        randomPoint -= section.weight;

        if (randomPoint < 0) {
            return section;
        }
    }

    return wheelSections[wheelSections.length - 1];
}

export function pickFlair() {
    return flairWords[Math.floor(Math.random() * flairWords.length)];
}
