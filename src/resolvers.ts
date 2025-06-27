import dotenv from "dotenv";
dotenv.config();
import { Recipe } from "./models/Recipie";
import { User } from "./models/User";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
const JWT_SECRET = process.env.JWT_SECRET!;
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
		recipe: async (_: any, args: { id: number }) => {
			return await Recipe.findOne({ id: args.id });
		},
		allCuisines: async () => {
			const result = await Recipe.aggregate([{ $group: { _id: "$cuisine" } }, { $sort: { _id: 1 } }]);
			return result.map((c) => c._id);
		},
		allMealTypes: async () => {
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
			}
		) => {
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
		createRecipe: async (_: any, args: { input: any }) => {
			try {
				const newRecipe = new Recipe(args.input);
				const saved = await newRecipe.save();
				return saved;
			} catch (err) {
				console.error("❌ Failed to save recipe:", err);
				throw new Error("Failed to create recipe");
			}
		},
		login: async (_: any, { input }: any) => {
			const { identifier, password } = input;

			// Check for user by username or email
			const user = await User.findOne({
				$or: [{ username: identifier }, { email: identifier }],
			});

			if (!user) throw new Error("User not found");

			const valid = await bcrypt.compare(password, user.password);
			if (!valid) throw new Error("Invalid password");

			const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, {
				expiresIn: "7d",
			});

			return {
				token,
				user: {
					id: user._id,
					username: user.username,
					email: user.email,
				},
			};
		},
		register: async (_: any, { input }: any) => {
			const { username, email, password } = input;

			// Check if user exists
			const existing = await User.findOne({ $or: [{ username }, { email }] });
			if (existing) throw new Error("Username or email already exists");

			// Hash the password
			const hashedPassword = await bcrypt.hash(password, 10);

			// Save user
			const newUser = await User.create({
				username,
				email,
				password: hashedPassword,
			});

			// Generate JWT
			const token = jwt.sign({ id: newUser._id, username: newUser.username }, JWT_SECRET, {
				expiresIn: "7d",
			});

			return {
				token,
				user: {
					id: newUser._id,
					username: newUser.username,
					email: newUser.email,
				},
			};
		},
	},
};
