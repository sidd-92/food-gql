import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { typeDefs } from "./schema";
import { resolvers } from "./resolvers";

dotenv.config();

const PORT = parseInt(process.env.PORT || "4000");

const startServer = async () => {
	// Connect to MongoDB
	try {
		await mongoose.connect(process.env.MONGO_URI as string);
		console.log("✅ MongoDB connected");
	} catch (err) {
		console.error("❌ MongoDB connection error:", err);
		return;
	}

	// Create Apollo Server
	const server = new ApolloServer({
		typeDefs,
		resolvers,
	});

	// Start server (standalone mode)
	const { url } = await startStandaloneServer(server, {
		listen: { port: PORT },
	});

	console.log(`🚀 Server ready at ${url}`);
};

startServer();
