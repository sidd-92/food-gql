import axios from "axios";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { Recipe } from "./models/Recipie";

dotenv.config();

const seedRecipes = async () => {
	try {
		// Connect to MongoDB
		await mongoose.connect(process.env.MONGO_URI as string);
		console.log("✅ MongoDB connected");

		// Fetch data from dummyjson
		const { data }: { data: any } = await axios.get("https://dummyjson.com/recipes?limit=0");

		// data.recipes should be the array
		if (!data?.recipes || !Array.isArray(data.recipes)) {
			throw new Error("Invalid data format from API");
		}

		// Clear existing recipes
		await Recipe.deleteMany({});
		console.log("🧹 Cleared existing recipes");

		// Insert fetched recipes into DB
		const inserted = await Recipe.insertMany(data.recipes);

		console.log(`🌱 Inserted ${inserted.length} recipes successfully!`);

		// Close connection
		await mongoose.disconnect();
	} catch (err) {
		console.error("❌ Seeding error:", err);
	}
};

seedRecipes();
