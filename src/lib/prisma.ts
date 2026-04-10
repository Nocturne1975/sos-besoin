import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../generated/prisma/client";

import "dotenv/config";

const globalForPrisma = globalThis as typeof globalThis & {
	prisma?: PrismaClient;
};

function createPrismaClient() {
	const connectionString = process.env.DATABASE_URL;

	if (!connectionString) {
		throw new Error("DATABASE_URL is not defined.");
	}

	return new PrismaClient({
		adapter: new PrismaNeon({ connectionString }),
		log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
	});
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
	globalForPrisma.prisma = prisma;
}

export default prisma;