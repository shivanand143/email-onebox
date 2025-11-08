import { useFilterStore } from "@/stores/filterStore";

export const SearchBar = () => {
  const { query, setQuery } = useFilterStore();

  return (
    <div>
      <label>Search</label>
      <div style={{ position: "relative", marginTop: "0.35rem" }}>
        <input
          className="input"
          placeholder="Search subject, sender, or body..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button
            className="button"
            style={{
              position: "absolute",
              right: "0.4rem",
              top: "50%",
              transform: "translateY(-50%)",
              padding: "0.3rem 0.7rem",
            }}
            onClick={() => setQuery("")}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};
