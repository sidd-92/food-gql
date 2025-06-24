import { Recipe } from "./models/Recipie";

export const resolvers = {
	Query: {
		recipes: async (_: any, args: { limit?: number; skip?: number }) => {
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
	},
};
