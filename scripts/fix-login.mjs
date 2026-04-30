import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise.js";
import { users } from "../drizzle/schema.js";
import { like, or } from "drizzle-orm";
import bcrypt from "bcryptjs";

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(conn);

// Find the RDIShop70 user
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

await conn.end();
