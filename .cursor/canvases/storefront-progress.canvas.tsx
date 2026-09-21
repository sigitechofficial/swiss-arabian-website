import {
  Card,
  CardBody,
  CardHeader,
  Divider,
  Grid,
  H1,
  H2,
  PieChart,
  Pill,
  Row,
  Stack,
  Stat,
  Text,
  TodoListCard,
  UsageBar,
} from "cursor/canvas";

/** Whole storefront — not home-only */
const ITEMS = [
  // Done
  {
    id: "home",
    content: "Home landing — full sections, Figma house band + story seal, theme/logo",
    status: "completed" as const,
  },
  {
    id: "shell",
    content: "Storefront shell — announcement, header, footer, mobile nav",
    status: "completed" as const,
  },
  {
    id: "rules",
    content: "Cursor rules — architecture, design-tokens, figma-home, home-landing",
    status: "completed" as const,
  },
  {
    id: "docs",
    content: "Project / admin overview docs in repo",
    status: "completed" as const,
  },
  // In progress / partial
  {
    id: "auth",
    content: "Auth — login + session real; register / forgot / reset still scaffolding",
    status: "in_progress" as const,
  },
  {
    id: "products",
    content: "Products — list/detail UI; still on PLACEHOLDER_PRODUCTS (no live API)",
    status: "in_progress" as const,
  },
  {
    id: "collections",
    content: "Collections — hard-coded cards/detail; no API yet",
    status: "in_progress" as const,
  },
  {
    id: "cart",
    content: "Cart — Zustand bag + checkout form; no backend cart/payment",
    status: "in_progress" as const,
  },
  {
    id: "account",
    content: "Account — hub + AuthGuard; orders/addresses/security placeholders",
    status: "in_progress" as const,
  },
  // Pending
  {
    id: "search",
    content: "Search — field only; wire results API",
    status: "pending" as const,
  },
  {
    id: "subscriptions",
    content: "Subscriptions page — stub “will connect here”",
    status: "pending" as const,
  },
  {
    id: "gift",
    content: "Gift cards / gift box — stub routes",
    status: "pending" as const,
  },
  {
    id: "newsletter-api",
    content: "Newsletter — real signup endpoint (no fake success)",
    status: "pending" as const,
  },
  {
    id: "api-catalog",
    content: "Catalog/home — replace static data with Swagger-backed APIs",
    status: "pending" as const,
  },
  {
    id: "figma-qa",
    content: "Visual QA — remaining shop pages vs Figma / prototype",
    status: "pending" as const,
  },
  {
    id: "commit",
    content: "Commit / PR for landing + rules (when you ask)",
    status: "pending" as const,
  },
] as const;

const done = ITEMS.filter((t) => t.status === "completed");
const active = ITEMS.filter((t) => t.status === "in_progress");
const pending = ITEMS.filter((t) => t.status === "pending");
const total = ITEMS.length;
const weightDone = done.length;
const weightActive = active.length;
const weightPending = pending.length;
/** Treat in-progress as half-complete for % */
const pct = Math.round(((weightDone + weightActive * 0.5) / total) * 100);

/** Single storefront progress canvas — all areas, not one page */
export default function StorefrontProgressCanvas() {
  return (
    <Stack gap={24} style={{ padding: 20 }}>
      <Stack gap={8}>
        <H1>Swiss Arabian storefront</H1>
        <Text tone="secondary">
          One progress board for the whole site — home, shop, auth, account,
          gifts, APIs. Not limited to a single page.
        </Text>
        <Row gap={8} style={{ flexWrap: "wrap" }}>
          <Pill tone="success" active>
            {weightDone} done
          </Pill>
          <Pill tone="info" active>
            {weightActive} in progress
          </Pill>
          <Pill tone="neutral" active>
            {weightPending} pending
          </Pill>
          <Pill tone="warning" active>
            ~{pct}% weighted
          </Pill>
        </Row>
      </Stack>

      <UsageBar
        total={total}
        topLeftLabel={`~${pct}% weighted complete`}
        topRightLabel={`${total} areas tracked`}
        segments={[
          { id: "done", value: weightDone, color: "green" },
          { id: "active", value: weightActive, color: "blue" },
          { id: "pending", value: weightPending, color: "orange" },
        ]}
      />
      <Text tone="tertiary" size="small">
        Source: codebase scan · in-progress counts as half toward % · Jul 2026
      </Text>

      <Grid columns={4} gap={12}>
        <Stat value={String(weightDone)} label="Done" tone="success" />
        <Stat value={String(weightActive)} label="In progress" tone="info" />
        <Stat value={String(weightPending)} label="Pending" tone="warning" />
        <Stat value={`${pct}%`} label="Weighted" />
      </Grid>

      <Grid columns={2} gap={16}>
        <Card>
          <CardHeader>Status mix</CardHeader>
          <CardBody>
            <PieChart
              data={[
                { label: "Done", value: weightDone, tone: "success" },
                { label: "In progress", value: weightActive, tone: "info" },
                { label: "Pending", value: weightPending, tone: "warning" },
              ]}
              size={200}
              donut
            />
            <Text tone="tertiary" size="small" style={{ marginTop: 8 }}>
              Storefront areas by status · count of tracked items
            </Text>
          </CardBody>
        </Card>

        <Stack gap={12}>
          <Card>
            <CardHeader>Route groups</CardHeader>
            <CardBody>
              <Stack gap={6}>
                <Text size="small">
                  <Text weight="semibold">(shop)</Text>
                  {" — home done; catalog/cart partial; gift/subs pending"}
                </Text>
                <Text size="small">
                  <Text weight="semibold">(auth)</Text>
                  {" — login live; register / reset scaffolding"}
                </Text>
                <Text size="small">
                  <Text weight="semibold">(account)</Text>
                  {" — hub + guard; orders / addresses stubs"}
                </Text>
              </Stack>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>Stack conventions</CardHeader>
            <CardBody>
              <Text size="small" tone="secondary">
                Thin pages → features; TanStack Query for server state; Zustand
                for auth/UI/cart only; Swagger is API source of truth.
              </Text>
            </CardBody>
          </Card>
        </Stack>
      </Grid>

      <Divider />
      <H2>Done</H2>
      <TodoListCard todos={[...done]} defaultExpanded />

      <H2>In progress</H2>
      <TodoListCard todos={[...active]} defaultExpanded />

      <H2>Pending</H2>
      <TodoListCard todos={[...pending]} defaultExpanded />
    </Stack>
  );
}
