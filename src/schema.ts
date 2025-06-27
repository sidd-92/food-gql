export const typeDefs = `
	type User {
    	id: ID!
    	username: String!
    	email: String!
  	}
	type AuthPayload {
    	token: String!
    	user: User!
  	}
	input LoginInput {
    	identifier: String!  # can be username or email
    	password: String!
  	}
	input RegisterInput {
    	username: String!
    	email: String!
    	password: String!
  	}	
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
		register(input: RegisterInput!): AuthPayload!
		login(input: LoginInput!): AuthPayload!
    }
`;
