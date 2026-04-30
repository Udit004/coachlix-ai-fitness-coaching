import SingleDietPlanClient from "@/feature/diet/detailDietPage/pages/SingleDietPlanClient";
export async function generateMetadata({ params }) {
  const { id } = await params;

  return {
    title: `Diet Plan ${id}`,
    description: `Details and recommendations for diet plan ${id}.`,
  };
}

export default async function SingleDietPlanPage({ params }) {
  const { id } = await params;

  return <SingleDietPlanClient planId={id} />;
}