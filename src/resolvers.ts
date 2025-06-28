import dotenv from "dotenv";
dotenv.config();
import { Recipe } from "./models/Recipie";
import { User } from "./models/User";
import { pubsub } from "./utils/pubSub";
import bcrypt from "bcryptjs";
import { createAccessToken, createRefreshToken, verifyRefreshToken } from "./utils/auth";
const RECIPE_ADDED = "RECIPE_ADDED";
export const resolvers = {
	Query: {
		recipes: async (_: any, args: { limit?: number; skip?: number }, context: { user: any }) => {
			if (!context.user) throw new Error("Unauthorized access. Please log in.");
			const { limit, skip } = args;

			let query = Recipe.find().sort({ _id: -1 });

			if (typeof skip === "number") query = query.skip(skip);
			if (typeof limit === "number") query = query.limit(limit);

			return await query;
		},
		recipe: async (_: any, args: { id: number }, context: { user: any }) => {
			if (!context.user) throw new Error("Unauthorized access. Please log in.");
			return await Recipe.findOne({ id: args.id });
		},
		allCuisines: async (_: any, __: any, context: { user: any }) => {
			if (!context.user) throw new Error("Unauthorized access. Please log in.");
			const result = await Recipe.aggregate([{ $group: { _id: "$cuisine" } }, { $sort: { _id: 1 } }]);
			return result.map((c) => c._id);
		},
		allMealTypes: async (_: any, __: any, context: { user: any }) => {
			if (!context.user) throw new Error("Unauthorized access. Please log in.");
			const result = await Recipe.aggregate([
				{ $unwind: "$mealType" },
				{ $group: { _id: "$mealType" } },
				{ $sort: { _id: 1 } },
			]);
			return result.map((r) => r._id);
		},
		filterByRecipe: async (
			_: any,
			args: {
				key: "CUISINE" | "DIFFICULTY" | "MEALTYPE";
				value: string;
				limit?: number;
				skip?: number;
				sortBy?: string;
				sortOrder?: string;
			},
			context: { user: any }
		) => {
			if (!context.user) throw new Error("Unauthorized access. Please log in.");
			const { key, value, limit = 10, skip = 0, sortBy = "_id", sortOrder = "desc" } = args;

			const keyMap: Record<string, string> = {
				CUISINE: "cuisine",
				DIFFICULTY: "difficulty",
				MEALTYPE: "mealType",
			};

			const field = keyMap[key];

			if (!field) {
				throw new Error("Invalid filter key");
			}

			const isArrayField = ["mealType"].includes(field);

			const filter = isArrayField
				? { [field]: { $in: [new RegExp(value, "i")] } }
				: { [field]: { $regex: value, $options: "i" } }; // partial + case-insensitive

			const sort: Record<string, 1 | -1> = {
				[sortBy]: sortOrder.toLowerCase() === "asc" ? 1 : -1,
			};

			return await Recipe.find(filter).skip(skip).limit(limit).sort(sort);
		},
	},
	Mutation: {
		createRecipe: async (_: any, args: { input: any }, context: { user: any }) => {
			if (!context.user) throw new Error("Unauthorized access. Please log in.");
			try {
				const newRecipe = new Recipe(args.input);
				const saved = await newRecipe.save();

				// 🔔 Publish the new recipe
				pubsub.publish(RECIPE_ADDED, { recipeAdded: saved });

				return saved;
			} catch (err) {
				console.error("❌ Failed to save recipe:", err);
				throw new Error("Failed to create recipe");
			}
		},
		register: async (_: any, { input }: any, context: any) => {
			const { username, email, password } = input;

			const existing = await User.findOne({ $or: [{ username }, { email }] });
			if (existing) throw new Error("Username or email already exists");

			const hashedPassword = await bcrypt.hash(password, 10);
			const newUser = await User.create({ username, email, password: hashedPassword });

			const accessToken = createAccessToken(newUser);
			const refreshToken = createRefreshToken(newUser);

			// Set refresh token cookie
			context.res.cookie("jid", refreshToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
				path: "/",
			});

			return {
				token: accessToken,
				refreshToken,
				user: {
					id: newUser._id,
					username: newUser.username,
					email: newUser.email,
				},
			};
		},

		login: async (_: any, { input }: any, context: any) => {
			const { identifier, password } = input;

			const user = await User.findOne({
				$or: [{ username: identifier }, { email: identifier }],
			});
			if (!user) throw new Error("User not found");

			const valid = await bcrypt.compare(password, user.password);
			if (!valid) throw new Error("Invalid password");

			const accessToken = createAccessToken(user);
			const refreshToken = createRefreshToken(user);

			context.res.cookie("jid", refreshToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
				path: "/",
			});

			return {
				token: accessToken,
				refreshToken,
				user: {
					id: user._id,
					username: user.username,
					email: user.email,
				},
			};
		},

		refreshToken: async (_: any, __: any, context: any) => {
			try {
				const cookieToken = context.req.cookies.jid;
				if (!cookieToken) throw new Error("No refresh token");

				const decoded: any = verifyRefreshToken(cookieToken);
				const user = await User.findById(decoded.id);
				if (!user) throw new Error("User not found");

				const newAccessToken = createAccessToken(user);
				const newRefreshToken = createRefreshToken(user);

				context.res.cookie("jid", newRefreshToken, {
					httpOnly: true,
					secure: process.env.NODE_ENV === "production",
					sameSite: "lax",
					path: "/",
				});

				return {
					token: newAccessToken,
					refreshToken: newRefreshToken,
					user: {
						id: user._id,
						username: user.username,
						email: user.email,
					},
				};
			} catch (err) {
				throw new Error("Invalid refresh token");
			}
		},
	},
	Subscription: {
		// 👇 Add the subscription resolver
		recipeAdded: {
			subscribe: () => pubsub.asyncIterableIterator([RECIPE_ADDED]),
		},
	},
};
