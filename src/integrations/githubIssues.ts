type GitHubRepository = {
  owner: string;
  repo: string;
};

type GitHubIssue = {
  html_url?: unknown;
  title?: unknown;
};

type GitHubSearchResponse = {
  items?: unknown;
};

const getErrorDetails = (error: unknown): string => {
  if (error instanceof Error) {
    return [
      `Name: ${error.name}`,
      `Message: ${error.message}`,
      "",
      "Stack:",
      error.stack ?? "No stack trace available.",
    ].join("\n");
  }

  return `Non-Error thrown value: ${String(error)}`;
};

const getRepository = (): GitHubRepository | undefined => {
  const repository = process.env.GITHUB_REPOSITORY;
  if (repository) {
    const [owner, repo] = repository.split("/");
    if (owner && repo) return { owner, repo };
  }

  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  if (!owner || !repo) return undefined;

  return { owner, repo };
};

const githubRequest = async <T>(
  path: string,
  init?: RequestInit,
): Promise<T> => {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN is missing");
  }

  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(
      `GitHub request failed: ${response.status} ${response.statusText}`,
    );
  }

  return (await response.json()) as T;
};

const findExistingIssue = async (
  repository: GitHubRepository,
  id: string,
): Promise<GitHubIssue | undefined> => {
  const query = `repo:${repository.owner}/${repository.repo} type:issue state:open in:title ${id}`;
  const params = new URLSearchParams({ q: query, per_page: "10" });
  const searchResult = await githubRequest<GitHubSearchResponse>(
    `/search/issues?${params}`,
  );

  if (!Array.isArray(searchResult.items)) return undefined;

  return searchResult.items.find((item): item is GitHubIssue => {
    if (typeof item !== "object" || item === null || !("title" in item)) {
      return false;
    }

    return typeof item.title === "string" && item.title.includes(id);
  });
};

const createIssue = async (
  repository: GitHubRepository,
  fnName: string,
  id: string,
  healingScript: string,
  error: unknown,
): Promise<GitHubIssue> => {
  const errorDetails = getErrorDetails(error);

  return githubRequest<GitHubIssue>(
    `/repos/${repository.owner}/${repository.repo}/issues`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `[jit-heal:${id}] ${fnName}`,
        body: `A verified JIT Heal script was generated for \`${fnName}\`.\n\nFingerprint: \`${id}\`\n\n## Original Error\n\n\`\`\`text\n${errorDetails}\n\`\`\`\n\n## Proposed Healing Script\n\n\`\`\`js\n${healingScript}\n\`\`\``,
      }),
    },
  );
};

export const openGitHubIssue = (
  fnName: string,
  id: string,
  healingScript: string,
  error: unknown,
): void => {
  void (async () => {
    const repository = getRepository();
    if (!repository) {
      console.log(
        "GitHub issue creation skipped: repository is not configured",
      );
      return;
    }

    const existingIssue = await findExistingIssue(repository, id);
    if (existingIssue) {
      console.log(
        `GitHub issue already exists for ${id}: ${existingIssue.html_url}`,
      );
      return;
    }

    const issue = await createIssue(
      repository,
      fnName,
      id,
      healingScript,
      error,
    );
    console.log(`GitHub issue opened for ${id}: ${issue.html_url}`);
  })().catch((error: unknown) => {
    console.error("GitHub issue creation failed", error);
  });
};
