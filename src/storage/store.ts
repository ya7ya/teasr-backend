import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { Pool } from "pg";
import { BigNumber, BigNumberish } from "ethers";
dotenv.config();

const poolConfig = {
  user: process.env.POSTGRES_USER || "postgres",
  host: process.env.POSTGRES_HOST || "localhost",
  database: process.env.POSTGRES_DB || "postgres",
  password: process.env.POSTGRES_PASSWORD || "postgres",
  port: process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT) : 5432,
};
// console.log('pool config', poolConfig);
// pools will use environment variables
// for connection information
const pool = new Pool(poolConfig);

export async function initialize() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const queryText = await fs.readFileSync(
      path.join(__dirname, "schema.sql"),
      "utf8"
    );
    const res = await client.query(queryText, []);
    await client.query("COMMIT");
    // console.log(res)
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function dbStop() {
  await pool.end();
}

// -----------------------------------------------
// users_reputations
// -----------------------------------------------
export async function getUserReputation(id: string): Promise<{
  id: string;
  reputation: number;
  createdAt: string;
  updatedAt: string;
} | null> {
  const res = await pool.query(
    "SELECT * FROM users_reputations WHERE profile_id = $1",
    [id]
  );
  if (res.rowCount === 0) {
    return null;
  }

  return {
    id: res.rows[0].profile_id,
    reputation: res.rows[0].reputation,
    createdAt: res.rows[0].created_at,
    updatedAt: res.rows[0].updated_at,
  };
}

export async function updateUserReputation(
  id: string,
  reputation: number
): Promise<{
  id: string;
  reputation: number;
  createdAt: string;
  updatedAt: string;
}> {
  const res = await pool.query(
    "UPDATE users_reputations SET reputation = $2, updated_at = NOW() WHERE profile_id = $1 RETURNING *",
    [id, reputation]
  );

  return {
    id: res.rows[0].profile_id,
    reputation: res.rows[0].reputation,
    createdAt: res.rows[0].created_at,
    updatedAt: res.rows[0].updated_at,
  };
}

export async function createUserReputation(
  id: string,
  reputation: number
): Promise<{
  id: string;
  reputation: number;
  createdAt: string;
  updatedAt: string;
}> {
  const res = await pool.query(
    "INSERT INTO users_reputations (profile_id, reputation) VALUES ($1, $2) RETURNING *",
    [id, reputation]
  );

  return {
    id: res.rows[0].profile_id,
    reputation: res.rows[0].reputation,
    createdAt: res.rows[0].created_at,
    updatedAt: res.rows[0].updated_at,
  };
}

// -----------------------------------------------
// publications_reputations
// -----------------------------------------------

export async function getPublicationReputation(id: string): Promise<{
  id: string;
  reputation: number;
  createdAt: string;
  updatedAt: string;
} | null> {
  const res = await pool.query(
    "SELECT * FROM publications_reputations WHERE pub_id = $1",
    [id]
  );
  if (res.rowCount === 0) {
    return null;
  }

  return {
    id: res.rows[0].pub_id,
    reputation: res.rows[0].reputation,
    createdAt: res.rows[0].created_at,
    updatedAt: res.rows[0].updated_at,
  };
}

export async function updatePublicationReputation(
  id: string,
  reputation: number
): Promise<{
  id: string;
  reputation: number;
  createdAt: string;
  updatedAt: string;
}> {
  const res = await pool.query(
    "UPDATE publications_reputations SET reputation = $2, updated_at = NOW() WHERE pub_id = $1 RETURNING *",
    [id, reputation]
  );

  return {
    id: res.rows[0].pub_id,
    reputation: res.rows[0].reputation,
    createdAt: res.rows[0].created_at,
    updatedAt: res.rows[0].updated_at,
  };
}

export async function createPublicationReputation(
  id: string,
  reputation: number
): Promise<{
  id: string;
  reputation: number;
  createdAt: string;
  updatedAt: string;
}> {
  const res = await pool.query(
    "INSERT INTO publications_reputations (pub_id, reputation) VALUES ($1, $2) RETURNING *",
    [id, reputation]
  );

  return {
    id: res.rows[0].pub_id,
    reputation: res.rows[0].reputation,
    createdAt: res.rows[0].created_at,
    updatedAt: res.rows[0].updated_at,
  };
}
