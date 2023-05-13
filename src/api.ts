import dotenv from "dotenv";
import {
  ApolloServer,
  ApolloServerOptions,
  GraphQLServerContext,
} from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { GraphQLError, GraphQLScalarType, GraphQLSchema, Kind } from "graphql";
import jsonwebtoken from "jsonwebtoken";
import { BigNumber, ethers, Signature } from "ethers";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import express from "express";
import http from "http";
import cors from "cors";
import { json } from "body-parser";
import { v4 } from "uuid";

import { initialize, dbStop, getUserReputation } from "./storage/store";
import {
  getProfilePublications,
  getProfileStats,
  getPublicationStats,
  getPublicationsReaction,
  verifyJwt,
} from "./lens-api";
import { calculateReputationScore, getProfileContentStats } from "./controller";

dotenv.config();

// -----------------------------------------------
// GraphQL
// -----------------------------------------------

const typeDefs = `#graphql

  type Reputation {
    id: String!
    reputation: Int!
    createdAt: String!
    updatedAt: String!
  }

  type AbsStats {
    totalFollowers: Int
    totalFollowing: Int
    totalPosts: Int
    totalComments: Int
    totalMirrors: Int
    totalPublications: Int
    totalCollects: Int
  }

  type Metric {
    mean: Float
    median: Float
    std: Float
  }

  type Stats {
    likes: Metric
    comments: Metric
    mirrors: Metric
    collects: Metric
  }

  type Query {
    profileReputation(id: String!): Stats
    publicationReputation(id: String!): Reputation
    pubStats(publicationId: String!): String
    profileStats(profileId: String!): AbsStats
    profileRecations(profileId: String!): String
  }
`;

const resolvers = {
  Query: {
    profileReputation: async (
      _parent: any,
      { id }: { id: string },
      _context: GraphQLServerContext
    ) => {
      try {
        const stats = await getProfileContentStats(id);
        console.log("commentStats", stats);
        return stats;
      } catch (e) {
        console.log("error", e);
        return null;
      }
    },
    publicationReputation: async (
      _parent: any,
      { id }: { id: string },
      _context: GraphQLServerContext
    ) => {
      return getUserReputation(id);
    },
    pubStats: async (
      _parent: any,
      { publicationId }: { publicationId: string },
      _context: GraphQLServerContext
    ) => {
      const publication = await getPublicationStats(publicationId);
      const pubStats = publication?.data?.publication?.stats;
      console.log("pubStats", pubStats);
      return JSON.stringify(pubStats);
    },
    profileStats: async (
      _parent: any,
      { profileId }: { profileId: string },
      _context: GraphQLServerContext
    ) => {
      const stats = await getProfileStats(profileId);
      const metrics = [
        {
          label: "totalFollowers",
          value: (stats?.totalFollowers as number) || 0,
        },
        {
          label: "totalFollowing",
          value: (stats?.totalFollowing as number) || 0,
        },
        {
          label: "totalPosts",
          value: (stats?.totalPosts as number) || 0,
        },
        {
          label: "totalComments",
          value: (stats?.totalComments as number) || 0,
        },
        {
          label: "totalMirrors",
          value: (stats?.totalMirrors as number) || 0,
        },
        {
          label: "totalPublications",
          value: (stats?.totalPublications as number) || 0,
        },
        {
          label: "totalCollects",
          value: (stats?.totalCollects as number) || 0,
        },
      ];

      const score = await calculateReputationScore(metrics);
      // console.log("profileStats", publication);
      // return JSON.stringify(publication);
      return score;
    },
    profileRecations: async (
      _parent: any,
      { profileId }: { profileId: string },
      _context: GraphQLServerContext
    ) => {
      const publication = await getPublicationsReaction(profileId);
      console.log("profileRecations", publication);
      return JSON.stringify(publication);
    },
  },
};

interface TeasrGraphQLContext {
  token?: string;
}

let server: ApolloServer<TeasrGraphQLContext>;

/**
 * start - start the server
 */
export async function start() {
  try {
    await initialize();
  } catch (error) {
    console.log("initialize error", error);
    throw error;
  }
  const app = express();
  const httpServer = http.createServer(app);
  server = new ApolloServer<TeasrGraphQLContext>({
    typeDefs,
    resolvers,
    logger: console,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await server.start();

  app.use(
    "/",
    cors({
      origin: [
        "http://localhost:3000",
        "http://localhost:4783",
        "*",
        /vercel\.app$/,
      ],
      optionsSuccessStatus: 200,
    }),
    json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        const token = req.headers["x-access-token"];
        if (!token) {
          return { isLoggedIn: false };
        }
        if (typeof token !== "string") {
          return { isLoggedIn: false };
        }

        const tokenTrimmed = token.replace("Bearer ", "").trim();
        let isLoggedIn: boolean = false;
        try {
          isLoggedIn = await verifyJwt(tokenTrimmed);
        } catch (err) {
          console.log("verify Token Error", err);
        }
        const decoded = jsonwebtoken.decode(tokenTrimmed);
        console.log("decoded", decoded);
        console.log("isLoggedIn", isLoggedIn);
        return {
          isLoggedIn,
          ethAddress: decoded?.id,
          lensRole: decoded?.role,
          iat: decoded?.iat,
          exp: decoded?.exp,
        };
      },
    })
  );

  await new Promise<void>((resolve) =>
    httpServer.listen(
      { port: process.env.PORT ? parseInt(process.env.PORT) : 4000 },
      resolve
    )
  );
  console.log(
    `🚀 Server ready graphQL: > http://localhost:${process.env.PORT || 4000}/`
  );
}

/**
 * stop - stop the server
 */
export async function stop() {
  await server.stop();
  await dbStop();
}
