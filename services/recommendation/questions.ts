export const shoppingGoals = [
  { value: "everyday", label: "Everyday essentials" },
  { value: "personal-care", label: "Personal care" },
  { value: "home-and-garden", label: "Home and garden" },
  { value: "gifting", label: "Gifting" },
] as const;

export const productFinderQuestions = [
  {
    key: "shoppingFor",
    title: "What are you shopping for?",
    hint: "Choose the kind of products you would like to explore.",
  },
  {
    key: "category",
    title: "Which category interests you?",
    hint: "Choose a category, or browse all categories.",
  },
  {
    key: "productType",
    title: "Which product format do you prefer?",
    hint: "Formats are based on product information provided by the store.",
  },
  {
    key: "preferences",
    title: "What product preferences matter to you?",
    hint: "Select any factual product attributes that are important to you.",
  },
  {
    key: "maximumPrice",
    title: "What is your budget?",
    hint: "Choose a maximum price, or leave it open.",
  },
  {
    key: "inStockOnly",
    title: "Would you like to see items currently in stock?",
    hint: "Unavailable items are excluded when you choose yes.",
  },
] as const;
