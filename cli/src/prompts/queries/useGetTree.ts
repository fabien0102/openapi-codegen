import got from "got";
import { useEffect, useState } from "react";

type getTreeOptions = {
  token?: string;
  owner: string;
  repo: string;
  skip: boolean;
};

type TreeObject = {
  path: string;
  type: "blob" | "tree";
};

type GetTreeResponse = {
  tree: Array<TreeObject>;
  truncated: boolean;
};

type Error = {
  message: string;
};

/**
 * Hook to retrieve github tree.
 *
 * https://docs.github.com/en/rest/reference/git#trees
 */
export const useGetTree = (options: getTreeOptions) => {
  const [state, setState] = useState<{
    data: TreeObject[];
    error?: string;
    loading: boolean;
  }>({ data: [], loading: true });

  useEffect(() => {
    if (options.skip || !options.token) return;

    const req = got.get(
      `https://api.github.com/repos/${options.owner}/${options.repo}/git/trees/HEAD?recursive=true`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          Authorization: `bearer ${options.token}`,
        },
      }
    );

    req.then((response) => {
      if (response.statusCode === 200) {
        req.json<GetTreeResponse>().then((r) =>
          setState({
            loading: false,
            data: r.tree.filter(
              (p) =>
                p.type === "blob" &&
                p.path.toLowerCase().match(/\.(json|yaml|yml)$/)
            ),
          })
        );
      } else {
        req.json<Error>().then((r) =>
          setState({
            loading: false,
            data: [],
            error: r.message,
          })
        );
      }
    });

    return () => {
      if (req) {
        req.cancel();
      }
    };
  }, [options.owner, options.repo, options.token]);

  return state;
};
