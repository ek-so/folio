// Whether a fetched GitHub state is older than the one held: compare's status of the fetched commit against the held one
// ('behind'). Anything else (ahead, diverged, or unknown: history rewritten) is taken as GitHub's truth.
export const isStale = status => status === 'behind'
