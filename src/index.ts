// Required dependencies
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import jwt from "jsonwebtoken";
import express from "express";
import http from "http";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import { typeDefs } from "./schema";
import { resolvers } from "./resolvers";
import { decodeUserFromToken } from "./utils/auth";

dotenv.config();

const PORT = parseInt(process.env.PORT || "4000");

interface MyContext {
	token?: string;
}

const startServer = async () => {
	// Connect to MongoDB
	try {
		await mongoose.connect(process.env.MONGO_URI!);
		console.log("✅ MongoDB connected");
	} catch (err) {
		console.error("❌ MongoDB connection error:", err);
		return;
	}

	const app = express();
	const httpServer = http.createServer(app);

	const server = new ApolloServer<MyContext>({
		typeDefs,
		resolvers,
		introspection: true,
		plugins: [
			ApolloServerPluginDrainHttpServer({ httpServer }),
			ApolloServerPluginLandingPageLocalDefault({ embed: true }),
			{
				async requestDidStart(requestContext) {
					const query = requestContext.request.query?.trim().replace(/\s+/g, " ");
					console.log(`🔍 Request started: ${query}`);
					return {
						async willSendResponse() {
							console.log(`✅ Response sent`);
						},
					};
				},
			},
		],
	});

	await server.start();

	app.use(
		"/",
		cors<cors.CorsRequest>(),
		express.json({ limit: "50mb" }),
		cookieParser(),
		expressMiddleware(server, {
			context: async ({ req, res }) => ({
				req,
				res,
				user: decodeUserFromToken(req.headers.authorization),
			}),
		})
	);

	await new Promise<void>((resolve) => httpServer.listen({ port: PORT }, resolve));
	console.log(`🚀 Server ready at http://localhost:${PORT}/`);
};

startServer();
