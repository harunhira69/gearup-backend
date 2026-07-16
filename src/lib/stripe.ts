import Stripe from "stripe";
import config from "../config";

const stripeSecretKey = config.stripe_secret_key || "sk_test_dummy";

export const stripe = new Stripe(stripeSecretKey);