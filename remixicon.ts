import { Octokit } from "@octokit/rest";

const octokit = new Octokit();

// Fetches a list of all Remixicons
export default function fetchRemixicons() {
  return new Promise((resolve) => {
  octokit.rest.git.getTree({
    owner: "Remix-Design",
    repo: "RemixIcon",
    tree_sha: "master",
    recursive: true,
  }).then((result) => resolve(
      result.data.tree
        .map((item) => item.path)
        .filter((path) =>
          path &&
          path.match(/^icons\/\w+\/[a-z-]+-line[.]svg$/))
        .map((path) => path
          .replace(/-line[.]svg$/, "")
          .replace(/^icons\/\w+\//, "")))
     );
  })
}
