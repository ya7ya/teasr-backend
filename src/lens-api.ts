import {
  ApolloClient,
  InMemoryCache,
  gql,
  HttpLink,
  ApolloLink,
} from "@apollo/client";
import { BigNumberish } from "ethers";

const APIURL = process.env.LENS_API_URL || "https://api-mumbai.lens.dev";
const httpLink = new HttpLink({ uri: APIURL });
const authLink = new ApolloLink((operation, forward) => {
  // add the authorization to the headers
  operation.setContext(({ headers = {} }) => ({
    headers: {
      // 'x-access-token': token ? `Bearer ${token}`: '',
    },
  }));

  return forward(operation);
});

const config = {
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
};
export let apolloClient = new ApolloClient(config);

export async function getLoginChallenge(address: string) {
  const query = gql`
    query ($request: ChallengeRequest!) {
      challenge(request: $request) {
        text
      }
    }
  `;
  const resp = await apolloClient.query({
    query: query,
    variables: {
      request: {
        address,
      },
    },
  });

  console.log("got challenge response: ", resp);
  return resp;
}

export async function authenticateUser(address: string, signature: string) {
  const mutation = gql`
    mutation ($request: SignedAuthChallenge!) {
      authenticate(request: $request) {
        accessToken
        refreshToken
      }
    }
  `;

  const resp = await apolloClient.mutate({
    mutation: mutation,
    variables: {
      request: {
        address,
        signature,
      },
    },
  });

  console.log("got auth response ", resp);
  return resp;
}

export async function verifyJwt(accessToken: string): Promise<boolean> {
  console.log("verifying ", accessToken);
  const query = gql`
    query ($request: VerifyRequest!) {
      verify(request: $request)
    }
  `;
  const resp = await apolloClient.query({
    query: query,
    variables: {
      request: {
        accessToken,
      },
    },
  });

  console.log("got verify response: ", resp);
  return resp?.data?.verify ? resp.data.verify : false;
}
