import {
  Destination,
  Body,
  Caption,
  Utility,
  Index,
  LinkButton,
} from "@/components/doctrine";

export default function BillingSuccessPage() {
  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <div className="w-full max-w-[520px] border-2 border-[var(--color-ground)]">
        <div className="bg-[var(--color-mark)] text-[var(--color-field)] px-7 pt-6 pb-7">
          <div className="flex items-center justify-between mb-5">
            <Index className="!text-[12px] !text-[var(--color-field)] opacity-80">
              B-PAID
            </Index>
            <span className="tag-tab -mt-6">CONFIRMED</span>
            <Utility className="opacity-80">SECTOR · A</Utility>
          </div>
          <Destination className="!text-[var(--color-field)] !text-[60px] !leading-none">
            TRIAL<br />STARTED.
          </Destination>
        </div>

        <div className="bg-[var(--color-field)] px-7 py-7">
          <Utility className="opacity-60 mb-2">RECEIPT</Utility>
          <Body className="mb-6">
            Your subscription is active. Your compliance deadlines are ready to track.
          </Body>
          <LinkButton href="/dashboard" variant="ground">
            Go to dashboard →
          </LinkButton>
          <Caption className="!mt-6 !opacity-60 !text-[12px]">
            A receipt has been emailed. Manage your subscription from{" "}
            <a href="/billing" className="t-link">/billing</a>.
          </Caption>
        </div>
      </div>
    </div>
  );
}
