import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
  const { data, error, isPending } = useSearchUsers(
    {
      queryParams: { q: query },
    },
    {
      enabled: Boolean(query),
    },
  );

  if (error) {
    return (
      <div>
        <pre>{JSON.stringify(error, null, 2)}</pre>
      </div>
    );
  }

  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      {isPending ? (
        <div>Loading…</div>
      ) : (
        <ul>
          {data.items.map((item) => (
            <li key={item.id}>{item.login}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
