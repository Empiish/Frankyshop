import "server-only";

// Compiled SQL fragment: text with $1…$N placeholders and corresponding params.
class SqlFragment {
  constructor(readonly text: string, readonly params: unknown[]) {}
}

// Build a SqlFragment from a tagged template, inlining nested SqlFragment values
// and parameterising everything else.
function buildFragment(strings: TemplateStringsArray, values: unknown[]): SqlFragment {
  let text = "";
  const params: unknown[] = [];

  for (let i = 0; i < strings.length; i++) {
    text += strings[i];
    if (i < values.length) {
      const v = values[i];
      if (v instanceof SqlFragment) {
        // Inline the fragment, offsetting its $N numbers to avoid collisions.
        const offset = params.length;
        const inlined = v.text.replace(/\$(\d+)/g, (_, n) => `$${Number(n) + offset}`);
        text += inlined;
        params.push(...v.params);
      } else {
        params.push(v);
        text += `$${params.length}`;
      }
    }
  }

  return new SqlFragment(text.trim(), params);
}

async function executeFragment<T>(fragment: SqlFragment): Promise<T> {
  const url = process.env.DATANEXUS_URL;
  const key = process.env.DATANEXUS_API_KEY;
  if (!url || !key) {
    throw new Error("DATANEXUS_URL and DATANEXUS_API_KEY must be set");
  }

  const res = await fetch(`${url}/api/v1/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ sql: fragment.text, params: fragment.params }),
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(
      `DataNexus query failed (${res.status}): ${(err as { error: string }).error}`,
    );
  }

  const data = (await res.json()) as { rows: T };
  return data.rows;
}

// SqlQuery is both a SqlFragment (so it can be embedded in outer templates)
// and a PromiseLike (so it can be awaited to execute the query).
// Execution is deferred until .then() is first called.
class SqlQuery<T> extends SqlFragment implements PromiseLike<T> {
  private _promise: Promise<T> | null = null;

  private get promise(): Promise<T> {
    if (!this._promise) this._promise = executeFragment<T>(this);
    return this._promise;
  }

  then<R1 = T, R2 = never>(
    onFulfilled?: ((value: T) => R1 | PromiseLike<R1>) | null,
    onRejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
  ): PromiseLike<R1 | R2> {
    return this.promise.then(onFulfilled, onRejected);
  }
}

// Tagged template function. Generic T is the full resolved type (e.g. ProductRow[]).
// When used as a value inside another sql`…` it acts as an inlined SQL fragment;
// when awaited it POSTs to DataNexus and returns T.
export function sql<T = unknown[]>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): SqlQuery<T> {
  const fragment = buildFragment(strings, values);
  return new SqlQuery<T>(fragment.text, fragment.params);
}
