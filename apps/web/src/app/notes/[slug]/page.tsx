import Header from "@/components/Header";
import NoteDetails from "@/components/notes/NoteDetails";
import { Id } from "@packages/backend/convex/_generated/dataModel";

export default async function Page(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  return (
    <main className="bg-[#F5F7FE] h-screen">
      <Header />
      <NoteDetails noteId={params.slug as Id<"notes">} />
    </main>
  );
}
