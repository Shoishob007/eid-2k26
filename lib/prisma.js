import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: ["warn", "error"],
    });

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}

let probePromise = null;

function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function getErrorMessage(error) {
    if (!error) {
        return "";
    }

    if (typeof error.message === "string") {
        return error.message;
    }

    return String(error);
}

export function isDatabaseConnectionIssue(error) {
    const message = getErrorMessage(error).toLowerCase();

    return (
        message.includes("error in postgresql connection") ||
        message.includes("kind: closed") ||
        message.includes("can't reach database server") ||
        message.includes("connection reset") ||
        message.includes("server closed the connection")
    );
}

export async function ensureDatabaseConnection() {
    if (probePromise) {
        return probePromise;
    }

    probePromise = (async () => {
        let lastError = null;

        for (let attempt = 0; attempt < 3; attempt += 1) {
            try {
                await prisma.$queryRaw`SELECT 1`;
                return;
            } catch (error) {
                lastError = error;

                if (!isDatabaseConnectionIssue(error)) {
                    throw error;
                }

                try {
                    await prisma.$disconnect();
                } catch {
                    // Ignore disconnect errors while recovering from transient connection failures.
                }

                await wait((attempt + 1) * 120);
            }
        }

        throw lastError;
    })();

    try {
        await probePromise;
    } finally {
        probePromise = null;
    }
}
