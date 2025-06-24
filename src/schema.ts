export const typeDefs = `
	enum FilterKey {
  		CUISINE
  		DIFFICULTY
  		MEALTYPE
	}
	type Recipe {
		id: Int
		name: String
		ingredients: [String]
		instructions: [String]
		prepTimeMinutes: Int
		cookTimeMinutes: Int
		servings: Int
		difficulty: String
		cuisine: String
		caloriesPerServing: Int
		tags: [String]
		userId: Int
		image: String
		rating: Float
		reviewCount: Int
		mealType: [String]
	}

	input RecipeInput {
    id: Int!
    name: String!
    ingredients: [String!]!
    instructions: [String!]!
    prepTimeMinutes: Int!
    cookTimeMinutes: Int!
    servings: Int!
    difficulty: String!
    cuisine: String!
    caloriesPerServing: Int!
    tags: [String!]!
    userId: Int!
    image: String!
    rating: Float!
    reviewCount: Int!
    mealType: [String!]!
  }

	type Query {
		recipes(limit: Int, skip: Int): [Recipe]
		recipe(id: Int!): Recipe
		allCuisines: [String]
		allMealTypes: [String]
		filterByRecipe(
			key: FilterKey!
			value: String!
			limit: Int
			skip: Int
			sortBy: String
			sortOrder: String
		): [Recipe]
	}

	type Mutation {
        createRecipe(input: RecipeInput!): Recipe
    }
`;
