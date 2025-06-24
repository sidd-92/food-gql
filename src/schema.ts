export const typeDefs = `
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
	}

	type Mutation {
        createRecipe(input: RecipeInput!): Recipe
    }
`;
