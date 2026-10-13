import { AdminResourcePage } from "@/app/(admin)/admin/_components/resource-page";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminResourcePage resource="products" recordId={id} />;
}
