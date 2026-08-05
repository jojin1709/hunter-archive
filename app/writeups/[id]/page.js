import Link from "next/link";
import { getWriteup, getRelatedWriteups } from "../../../lib/localStore.mjs";
import WriteupDetailClient from "./WriteupDetailClient";

export default async function WriteupPage({ params }) {
  const item = await getWriteup(params.id);
  if (!item) {
    return (
      <main className="detail-page">
        <Link className="back-link" href="/">
          ← Back to archive
        </Link>
        <h1 style={{ marginTop: "30px" }}>Writeup not found</h1>
      </main>
    );
  }

  const related = await getRelatedWriteups(params.id, item.tags || [], 4);
  return <WriteupDetailClient item={item} related={related} />;
}
