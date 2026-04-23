import type { Metadata } from "next";
import { IntroductionBook } from "./book";

export const metadata: Metadata = {
  title: "منصة محتوى — عرض تقديمي لشركة مكاسب",
  description:
    "عرض تقديمي تفاعلي لمنصة إدارة المقالات وتحسين المنتجات — مُخصص لشركة مكاسب.",
};

export default function IntroductionPage() {
  return <IntroductionBook />;
}
