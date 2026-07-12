import { notFound } from "next/navigation";
import { getServiceById } from "@/lib/repo";
import { Builder } from "./builder";

export default async function BuilderPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const service = getServiceById(Number(id));
  if (!service) notFound();

  return <Builder initial={service} />;
}
