import { computeBCS } from "../lib/bcsEngine";

const dummy = {
  hotel: {
    rating: 4.3,
    user_ratings_total: 683,
    price_level: 2,
    types: ["lodging", "hotel"]
  },
  cityMod: {},
  ageBand: "7-12m",
  directOnly: true,
};

const bcs = computeBCS(dummy as any);
console.log(JSON.stringify(bcs));