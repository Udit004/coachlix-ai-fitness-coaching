
const metadata = {
  title: "Diet Plans",
  description: "Explore our personalized diet plans to achieve your fitness goals. Whether you're looking to lose weight, build muscle, or maintain a healthy lifestyle, our expert-designed meal plans will guide you every step of the way.",
};

export { metadata };

import DietPlanClient from "@/feature/diet/dietlist/pages/DietPlanListClient";

export default function DietPlansPage() {
  return <DietPlanClient />;
}
