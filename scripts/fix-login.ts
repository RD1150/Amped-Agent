import { drizzle } from "drizzle-orm/mysql2";
import { users } from "../drizzle/schema";
import { like, or } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

const found = await db.select({
  id: users.id,
  name: users.name,
  email: users.email,
  loginMethod: users.loginMethod,
  openId: users.openId,
}).from(users).where(
  or(
    like(users.email, "%rdishop%"),
    like(users.email, "%rdshop%"),
    like(users.email, "%reena%"),
    like(users.name, "%Reena%"),
  )
).limit(10);

console.log("Users found:", JSON.stringify(found, null, 2));
process.exit(0);
