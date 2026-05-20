import {
  Destination,
  Body,
  Caption,
  LinkButton,
} from "@/components/doctrine";
import { PageShell } from "@/components/doctrine/PageShell";
import { PageSection } from "@/components/doctrine/PageSection";

export default function BillingSuccessPage() {
  return (
    <PageShell width="narrow">
      <PageSection title="B-PAID · CONFIRMED" tone="mark">
        <div className="bg-[var(--color-mark)] text-[var(--color-field)] px-6 py-7">
          <Destination className="!text-[var(--color-field)] !text-[60px] !leading-none">
            TRIAL<br />STARTED.
          </Destination>
        </div>
      </PageSection>

      <PageSection title="Receipt">
        <div className="bg-[var(--color-field)] px-4 py-5 flex flex-col gap-5">
          <Body>
            Your subscription is active. Your compliance deadlines are ready to
            track.
          </Body>
          <div>
            <LinkButton href="/dashboard" variant="ground">
              Go to dashboard →
            </LinkButton>
          </div>
          <Caption className="!text-[12px]">
            A receipt has been emailed. Manage your subscription from{" "}
            <a href="/billing" className="t-link">/billing</a>.
          </Caption>
        </div>
      </PageSection>
    </PageShell>
  );
}
