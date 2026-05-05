"use client";

import { useEffect, useState } from "react";

export default function AdminSecurityPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch("/api/health/launch-policies")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Security</h1>
      <p className="text-sm text-text-secondary">
        Current policy gates and deployment safety states.
      </p>
      <pre className="border border-border p-4 text-xs overflow-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
