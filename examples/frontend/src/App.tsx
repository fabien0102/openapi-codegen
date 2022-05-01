import { useState } from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { AuthProvider } from "./Auth";
import { useSearchUsers } from "./github/githubComponents";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Users />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function Users() {
  const [query, setQuery] = useState("");
  const { data, error, isLoading } = useSearchUsers(
    {
      queryParams: { q: query },
    },
    {
      enabled: Boolean(query),
    }
  );

  if (error) {
    return (
      <div>
        <p>{error.message}</p>
        <a href={error.documentation_url}>Documentation</a>
      </div>
    );
  }

  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      {isLoading ? (
        <div>Loading…</div>
      ) : (
        <ul>
          {data?.items.map((item) => (
            <li key={item.id}>{item.login}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
