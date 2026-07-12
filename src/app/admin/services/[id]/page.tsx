import { notFound } from "next/navigation";
import { getServiceById } from "@/lib/repo";
import { isAdmin } from "@/lib/auth";
import { AdminLogin } from "../../login";
import { Builder } from "./builder";

export default async function BuilderPage(props: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return <AdminLogin />;
  const { id } = await props.params;
  const service = getServiceById(Number(id));
  if (!service) notFound();

  return <Builder initial={service} />;
}
