import { getOctokit, getOwnerRepo } from "./github-utils"

const AUTO_MERGE_QUERY = `
  query($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      autoMergeAllowed
      pullRequest(number: $number) {
        id
        number
        title
        state
        isDraft
        mergeable
        mergeStateStatus
        autoMergeRequest {
          enabledAt
          mergeMethod
        }


      }
    }
  }
`

interface AutoMergeRequest {
  enabledAt: string
  mergeMethod: "MERGE" | "SQUASH" | "REBASE"
}

interface PullRequest {
  id: string
  number: number
  title: string
  state: "CLOSED" | "MERGED" | "OPEN"
  isDraft: boolean
  mergeable: "CONFLICTING" | "MERGEABLE" | "UNKNOWN"
  mergeStateStatus:
    | "BEHIND"
    | "BLOCKED"
    | "CLEAN"
    | "DIRTY"
    | "DRAFT"
    | "HAS_HOOKS"
    | "UNKNOWN"
    | "UNSTABLE"
  autoMergeRequest: AutoMergeRequest | null
  reviewRequests: {
    totalCount: number
  }
}

interface Repository {
  autoMergeAllowed: boolean
  pullRequest: PullRequest | null
}

interface GraphQLResponse {
  repository: Repository
}

export async function checkAutoMergeAvailability(pullNumber: number) {
  const octokit = await getOctokit()
  const [owner, repo] = await getOwnerRepo()
  const response = await octokit.graphql<GraphQLResponse>(AUTO_MERGE_QUERY, {
    owner,
    repo,
    number: pullNumber,
  })

  const { repository } = response
  const pr = repository.pullRequest

  if (!pr) {
    throw new Error(`Pull request #${pullNumber} not found`)
  }

  const analysis = {
    repository: {
      autoMergeAllowed: repository.autoMergeAllowed,
    },
    autoMerge: {
      currentlyEnabled: pr.autoMergeRequest !== null,
      enabledAt: pr.autoMergeRequest?.enabledAt,
      mergeMethod: pr.autoMergeRequest?.mergeMethod,
    },
  }

  return analysis
}

interface EnableAutoMergeResponse {
  enablePullRequestAutoMerge: {
    pullRequest: {
      autoMergeRequest: AutoMergeRequest
    }
  }
}

// export async function enableAutoMerge(
//   pullRequestId: number,
//   mergeMethod: "MERGE" | "SQUASH" | "REBASE" = "MERGE",
// ): Promise<AutoMergeRequest> {
//   const ENABLE_AUTO_MERGE_MUTATION = `
//     mutation($pullRequestId: ID!, $mergeMethod: PullRequestMergeMethod!) {
//       enablePullRequestAutoMerge(input: {
//         pullRequestId: $pullRequestId
//         mergeMethod: $mergeMethod
//       }) {
//         pullRequest {
//           autoMergeRequest {
//             enabledAt
//             mergeMethod
//           }
//         }
//       }
//     }
//   `
//   const octokit = await getOctokit()

//   const response = await octokit.graphql<EnableAutoMergeResponse>(
//     ENABLE_AUTO_MERGE_MUTATION,
//     {
//       pullRequestId,
//       mergeMethod,
//     },
//   )

//   return response.enablePullRequestAutoMerge.pullRequest.autoMergeRequest
// }

export async function enableAutoMerge(prId: number) {
  // const octokit = await getOctokit()

  // // 1. Get the pull request ID
  // const { repository } =  await octokit.graphql(`
  //   query GetPullRequestId($owner: String!, $repo: String!, $prNumber: Int!) {
  //     repository(owner: $owner, name: $repo) {
  //       pullRequest(number: $prNumber) {
  //         id
  //       }
  //     }
  //   }
  // `, {
  //   owner,
  //   repo,
  //   prNumber,
  // });

  // const pullRequestId = repository.pullRequest.id;

  const octokit = await getOctokit()
  // 2. Enable auto-merge
  const response = await octokit.graphql(
    `
      mutation EnableAutoMerge($pullRequestId: ID!, $mergeMethod: PullRequestMergeMethod) {
        enablePullRequestAutoMerge(input: {pullRequestId: $pullRequestId, mergeMethod: $mergeMethod}) {
          clientMutationId
        }
      }
    `,
    {
      pullRequestId: prId,
      mergeMethod: "MERGE", // or "SQUASH", "REBASE"
    },
  )

  console.log(response)
}
