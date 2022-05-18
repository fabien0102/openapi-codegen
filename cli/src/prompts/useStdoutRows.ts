import { useEffect, useState } from "react";

/**
 * Returns `stdout.rows` up-to-date with the console size.
 */
export function useStdoutRows() {
  const [rows, setRows] = useState(process.stdout.rows);
  useEffect(() => {
    const onResize = () => setRows(process.stdout.rows);
    const listener = process.stdout.on("resize", onResize);

    return () => {
      listener.off("resize", onResize);
    };
  }, []);

  return rows;
}

/**
 * # TODO
- manual file if `truncated`
- "autre"
- Update token scope `[read:org]`
- Better error handling (auth)
- 
 */
