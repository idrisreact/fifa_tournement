import { PageHeader } from "@/components/PageHeader";
import { RuleBanner } from "@/components/RuleBanner";
import { rulesSections } from "@/lib/rules";

export default function RulesPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Competition law"
        title="Rules"
        description="The full operating manual for results, bonuses, conduct, and end-of-season honours."
      />
      <section className="grid gap-4 lg:grid-cols-2">
        {rulesSections.map((section) => (
          <RuleBanner key={section.title} title={section.title} items={section.items} />
        ))}
      </section>
    </div>
  );
}
