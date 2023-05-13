import {
  ApolloClient,
  InMemoryCache,
  gql,
  HttpLink,
  ApolloLink,
} from "@apollo/client";
import { BigNumberish } from "ethers";

const APIURL = process.env.LENS_API_URL || "https://api.lens.dev";
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

export async function getPublicationStats(publicationId: BigNumberish) {
  const query = gql`
    query Publication($request: PublicationQueryRequest!) {
      publication(request: $request) {
        __typename
        ... on Post {
          ...PostFields
        }
        ... on Comment {
          ...CommentFields
        }
        ... on Mirror {
          ...MirrorFields
        }
      }
    }

    fragment MediaFields on Media {
      url
      mimeType
    }

    fragment ProfileFields on Profile {
      id
      name
      bio
      attributes {
        displayType
        traitType
        key
        value
      }
      isFollowedByMe
      isFollowing(who: null)
      followNftAddress
      metadata
      isDefault
      handle
      picture {
        ... on NftImage {
          contractAddress
          tokenId
          uri
          verified
        }
        ... on MediaSet {
          original {
            ...MediaFields
          }
        }
      }
      coverPicture {
        ... on NftImage {
          contractAddress
          tokenId
          uri
          verified
        }
        ... on MediaSet {
          original {
            ...MediaFields
          }
        }
      }
      ownedBy
      dispatcher {
        address
      }
      stats {
        totalFollowers
        totalFollowing
        totalPosts
        totalComments
        totalMirrors
        totalPublications
        totalCollects
        totalUpvotes
        totalDownvotes
      }
      followModule {
        ...FollowModuleFields
      }
    }

    fragment PublicationStatsFields on PublicationStats {
      totalAmountOfMirrors
      totalAmountOfCollects
      totalAmountOfComments
      totalUpvotes
    }

    fragment Erc20Fields on Erc20 {
      name
      symbol
      decimals
      address
    }

    fragment PostFields on Post {
      id
      profile {
        ...ProfileFields
      }
      stats {
        ...PublicationStatsFields
      }
      metadata {
        ...MetadataOutputFields
      }
      createdAt
      collectModule {
        ...CollectModuleFields
      }
      referenceModule {
        ...ReferenceModuleFields
      }
      appId
      hidden
      reaction(request: null)
      mirrors(by: null)
      hasCollectedByMe
    }

    fragment MirrorBaseFields on Mirror {
      id
      profile {
        ...ProfileFields
      }
      stats {
        ...PublicationStatsFields
      }
      metadata {
        ...MetadataOutputFields
      }
      createdAt
      collectModule {
        ...CollectModuleFields
      }
      referenceModule {
        ...ReferenceModuleFields
      }
      appId
      hidden
      reaction(request: null)
      hasCollectedByMe
    }

    fragment MirrorFields on Mirror {
      ...MirrorBaseFields
      mirrorOf {
        ... on Post {
          ...PostFields
        }
        ... on Comment {
          ...CommentFields
        }
      }
    }

    fragment CommentBaseFields on Comment {
      id
      profile {
        ...ProfileFields
      }
      stats {
        ...PublicationStatsFields
      }
      metadata {
        ...MetadataOutputFields
      }
      createdAt
      collectModule {
        ...CollectModuleFields
      }
      referenceModule {
        ...ReferenceModuleFields
      }
      appId
      hidden
      reaction(request: null)
      mirrors(by: null)
      hasCollectedByMe
    }

    fragment CommentFields on Comment {
      ...CommentBaseFields
      mainPost {
        ... on Post {
          ...PostFields
        }
        ... on Mirror {
          ...MirrorBaseFields
          mirrorOf {
            ... on Post {
              ...PostFields
            }
            ... on Comment {
              ...CommentMirrorOfFields
            }
          }
        }
      }
    }

    fragment CommentMirrorOfFields on Comment {
      ...CommentBaseFields
      mainPost {
        ... on Post {
          ...PostFields
        }
        ... on Mirror {
          ...MirrorBaseFields
        }
      }
    }

    fragment FollowModuleFields on FollowModule {
      ... on FeeFollowModuleSettings {
        type
        amount {
          asset {
            name
            symbol
            decimals
            address
          }
          value
        }
        recipient
      }
      ... on ProfileFollowModuleSettings {
        type
        contractAddress
      }
      ... on RevertFollowModuleSettings {
        type
        contractAddress
      }
      ... on UnknownFollowModuleSettings {
        type
        contractAddress
        followModuleReturnData
      }
    }

    fragment CollectModuleFields on CollectModule {
      __typename
      ... on FreeCollectModuleSettings {
        type
        followerOnly
        contractAddress
      }
      ... on FeeCollectModuleSettings {
        type
        amount {
          asset {
            ...Erc20Fields
          }
          value
        }
        recipient
        referralFee
      }
      ... on LimitedFeeCollectModuleSettings {
        type
        collectLimit
        amount {
          asset {
            ...Erc20Fields
          }
          value
        }
        recipient
        referralFee
      }
      ... on LimitedTimedFeeCollectModuleSettings {
        type
        collectLimit
        amount {
          asset {
            ...Erc20Fields
          }
          value
        }
        recipient
        referralFee
        endTimestamp
      }
      ... on RevertCollectModuleSettings {
        type
      }
      ... on TimedFeeCollectModuleSettings {
        type
        amount {
          asset {
            ...Erc20Fields
          }
          value
        }
        recipient
        referralFee
        endTimestamp
      }
      ... on UnknownCollectModuleSettings {
        type
        contractAddress
        collectModuleReturnData
      }
    }

    fragment ReferenceModuleFields on ReferenceModule {
      ... on FollowOnlyReferenceModuleSettings {
        type
        contractAddress
      }
      ... on UnknownReferenceModuleSettings {
        type
        contractAddress
        referenceModuleReturnData
      }
      ... on DegreesOfSeparationReferenceModuleSettings {
        type
        contractAddress
        commentsRestricted
        mirrorsRestricted
        degreesOfSeparation
      }
    }
  `;
  const resp = await apolloClient.query({
    query: query,
    variables: {
      request: {
        publicationId,
      },
    },
  });

  console.log("got publication stats response: ", resp);
  return resp?.data?.publication?.stats;
}

export async function getProfilePublications(profileId: string, limit = 25) {
  const query = gql`
    query Publications($request: PublicationsQueryRequest!) {
      publications(request: $request) {
        items {
          __typename
          ... on Post {
            ...PostFields
          }
          ... on Comment {
            ...CommentFields
          }
          ... on Mirror {
            ...MirrorFields
          }
        }
        pageInfo {
          prev
          next
          totalCount
        }
      }
    }

    fragment PublicationStatsFields on PublicationStats {
      totalAmountOfMirrors
      totalAmountOfCollects
      totalAmountOfComments
      totalUpvotes
      totalDownvotes
    }

    fragment PostFields on Post {
      id
      stats {
        ...PublicationStatsFields
      }
      createdAt
      appId
      hidden
      reaction(request: null)
      mirrors(by: null)
      hasCollectedByMe
    }

    fragment MirrorBaseFields on Mirror {
      id
      stats {
        ...PublicationStatsFields
      }
      createdAt
      appId
      hidden
      reaction(request: null)
      hasCollectedByMe
    }

    fragment MirrorFields on Mirror {
      ...MirrorBaseFields
      mirrorOf {
        ... on Post {
          ...PostFields
        }
        ... on Comment {
          ...CommentFields
        }
      }
    }

    fragment CommentBaseFields on Comment {
      id
      stats {
        ...PublicationStatsFields
      }
      createdAt
      appId
      hidden
      reaction(request: null)
      mirrors(by: null)
      hasCollectedByMe
    }

    fragment CommentFields on Comment {
      ...CommentBaseFields
      mainPost {
        ... on Post {
          ...PostFields
        }
        ... on Mirror {
          ...MirrorBaseFields
          mirrorOf {
            ... on Post {
              ...PostFields
            }
            ... on Comment {
              ...CommentMirrorOfFields
            }
          }
        }
      }
    }

    fragment CommentMirrorOfFields on Comment {
      ...CommentBaseFields
      mainPost {
        ... on Post {
          ...PostFields
        }
        ... on Mirror {
          ...MirrorBaseFields
        }
      }
    }
  `;

  const resp = await apolloClient.query({
    query,
    variables: {
      request: {
        profileId,
        limit,
      },
    },
  });

  // console.log("resp", resp);
  const stats = resp.data?.publications?.items?.map((item) => {
    if (item.__typename === "Post" || item.__typename === "Comment") {
      return {
        id: item.id,
        ...item.stats,
      };
    } else if (item.__typename === "Mirror") {
      // we might have to get rid of mirror stats
      // return item.stats;
    }
  });
  // console.log("stats: ", stats);

  return stats;
}

export async function getPublicationsReaction(profileId: string) {
  const query = gql`
    query Publications(
      $publicationsRequest: PublicationsQueryRequest!
      $reactionRequest: ReactionFieldResolverRequest
    ) {
      publications(request: $publicationsRequest) {
        items {
          __typename
          ... on Post {
            reaction(request: $reactionRequest) {
              upvotes
            }
          }
          ... on Comment {
            reaction(request: $reactionRequest) {
              upvotes
            }
          }
          ... on Mirror {
            reaction(request: $reactionRequest) {
              upvotes
            }
          }
        }
        pageInfo {
          prev
          next
          totalCount
        }
      }
    }
  `;
  const resp = await apolloClient.query({
    query,
    variables: {
      publicationsRequest: {
        profileId,
      },
      reactionRequest: {
        profileId,
      },
    },
  });

  console.log("resp", resp.data);

  return resp.data?.publications;
}

export async function getProfileStats(profileId: string) {
  const query = gql`
    query profile($request: SingleProfileQueryRequest!) {
      profile(request: $request) {
        id
        name
        followNftAddress
        metadata
        isDefault
        handle
        ownedBy
        stats {
          totalFollowers
          totalFollowing
          totalPosts
          totalComments
          totalMirrors
          totalPublications
          totalCollects
        }
      }
    }
  `;

  const resp = await apolloClient.query({
    query,
    variables: {
      request: {
        profileId,
      },
    },
  });

  console.log("resp", resp.data);

  return resp.data?.profile?.stats;
}