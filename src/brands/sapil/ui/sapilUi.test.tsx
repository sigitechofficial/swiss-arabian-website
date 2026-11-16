import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  Accordion,
  AnnouncementBar,
  Breadcrumbs,
  Button,
  Checkbox,
  Chip,
  Dialog,
  Drawer,
  Field,
  Fieldset,
  formatAED,
  IconButton,
  Price,
  ProductCard,
  QuantityStepper,
  RadioCardGroup,
  SectionHead,
  Stars,
  Steps,
  Subnav,
  Tabs,
  Toast,
} from "./index";

describe("Sapil UI kit", () => {
  it("formats prices like v9", () => {
    expect(formatAED(63)).toBe("AED 63");
    expect(formatAED(19.75)).toBe("AED 19.75");
  });

  it("Button renders a button or a link", () => {
    const onClick = vi.fn();
    render(
      <>
        <Button onClick={onClick}>Checkout</Button>
        <Button href="/shop" variant="line">
          Shop all
        </Button>
      </>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Checkout" }));
    expect(onClick).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Checkout" })).toHaveAttribute("type", "button");
    expect(screen.getByRole("link", { name: "Shop all" })).toHaveAttribute("href", "/shop");
  });

  it("IconButton has an accessible name and hides the badge from AT", () => {
    render(
      <IconButton label="Bag, 3 items" badge={3}>
        <svg />
      </IconButton>,
    );
    expect(screen.getByRole("button", { name: "Bag, 3 items" })).toBeInTheDocument();
  });

  it("Chip exposes its pressed state", () => {
    render(
      <Chip pressed count={4}>
        Floral
      </Chip>,
    );
    expect(screen.getByRole("button", { name: /Floral/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("ProductCard: links, discount, prices, add button", () => {
    const onAdd = vi.fn();
    render(
      <ProductCard
        name="Berry Crush"
        href="/p/berry-crush"
        image="/b.webp"
        tile="sky"
        price="AED 63"
        was="AED 90"
        discountPercent={30}
        tags={["EDP", "Unisex"]}
        onAdd={onAdd}
      />,
    );
    expect(screen.getByRole("article")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Berry Crush" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View Berry Crush" })).toHaveAttribute("href", "/p/berry-crush");
    // the hover "Shop Now" pill is hidden from AT and the tab order, as in v9
    expect(screen.queryByRole("link", { name: "Shop Now" })).toBeNull();
    expect(screen.getByText("−30%")).toBeInTheDocument();
    expect(screen.getByText("AED 90").closest("s")).not.toBeNull();
    expect(screen.getByAltText("Berry Crush bottle")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add Berry Crush to bag" }));
    expect(onAdd).toHaveBeenCalled();
  });

  it("Price reads the was-price", () => {
    render(<Price value="AED 63" was="AED 90" />);
    expect(screen.getByText(/was/)).toBeInTheDocument();
  });

  it("Stars is one labelled image", () => {
    render(<Stars rating={4} />);
    expect(screen.getByRole("img", { name: "4 out of 5 stars" })).toBeInTheDocument();
  });

  it("Breadcrumbs marks the current page", () => {
    render(<Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Blogs" }]} />);
    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(nav).toHaveTextContent("Home / Blogs");
    expect(screen.getByText("Blogs")).toHaveAttribute("aria-current", "page");
  });

  it("SectionHead renders eyebrow, heading with accent and actions", () => {
    render(<SectionHead eyebrow="New arrivals" title="Just landed," accent="still fizzing." actions={<a href="#x">All</a>} />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Just landed, still fizzing.");
    expect(screen.getByText("New arrivals")).toBeInTheDocument();
  });

  it("Field labels its input, shows errors accessibly, supports a prefix", () => {
    render(
      <Fieldset legend="Contact">
        <Field label="Email" type="email" error="Enter an email." />
        <Field label="Mobile number" type="tel" prefix="+971" optional />
        <Checkbox defaultChecked>Send me offers</Checkbox>
      </Fieldset>,
    );
    expect(screen.getByRole("group", { name: "Contact" })).toBeInTheDocument();
    const email = screen.getByLabelText("Email");
    expect(email).toHaveAttribute("type", "email");
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveAccessibleDescription("Enter an email.");
    expect(screen.getByLabelText(/Mobile number/)).toHaveAttribute("type", "tel");
    expect(screen.getByText("+971")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Send me offers" })).toBeChecked();
  });

  it("RadioCardGroup selects options and shows the selected panel", () => {
    const onChange = vi.fn();
    render(
      <RadioCardGroup
        name="pay"
        aria-label="Payment"
        onValueChange={onChange}
        options={[
          { value: "card", title: "Card", panel: <p>Card fields</p> },
          { value: "cod", title: "Cash on delivery", fee: "AED 10" },
        ]}
      />,
    );
    expect(screen.getByRole("radiogroup", { name: "Payment" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Card/ })).toBeChecked();
    expect(screen.getByText("Card fields")).toBeVisible();
    fireEvent.click(screen.getByRole("radio", { name: /Cash on delivery/ }));
    expect(onChange).toHaveBeenCalledWith("cod");
    expect(screen.getByRole("radio", { name: /Cash on delivery/ })).toBeChecked();
    expect(screen.getByText("Card fields")).not.toBeVisible();
  });

  it("Steps marks the current step and lets done steps be revisited", () => {
    const onSelect = vi.fn();
    render(
      <Steps
        steps={[
          { label: "Bag", state: "done", onSelect, selectLabel: "Bag, done. Open your bag" },
          { label: "Delivery", state: "current" },
          { label: "Payment", state: "upcoming" },
        ]}
      />,
    );
    expect(screen.getByRole("list", { name: "Checkout progress" })).toBeInTheDocument();
    expect(screen.getByText("Delivery").closest("li")).toHaveAttribute("aria-current", "step");
    fireEvent.click(screen.getByRole("button", { name: "Bag, done. Open your bag" }));
    expect(onSelect).toHaveBeenCalled();
  });

  it("QuantityStepper steps and labels its buttons", () => {
    const onChange = vi.fn();
    render(<QuantityStepper value={1} onChange={onChange} itemLabel="Berry Crush" removeAtMin />);
    expect(screen.getByRole("group", { name: "Quantity, Berry Crush" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Increase Berry Crush" }));
    expect(onChange).toHaveBeenCalledWith(2);
    fireEvent.click(screen.getByRole("button", { name: "Remove Berry Crush" }));
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it("Tabs: link mode marks the current page; tab mode is a keyboard tablist", () => {
    const { unmount } = render(
      <Tabs
        label="Shop by price"
        value="99"
        items={[
          { value: "50", label: "Under AED 50", href: "?max=50" },
          { value: "99", label: "Under AED 99", href: "?max=99" },
        ]}
      />,
    );
    expect(screen.getByRole("link", { name: "Under AED 99" })).toHaveAttribute("aria-current", "page");
    unmount();
    const onChange = vi.fn();
    render(
      <Tabs
        label="Views"
        value="a"
        onValueChange={onChange}
        items={[
          { value: "a", label: "A" },
          { value: "b", label: "B" },
        ]}
      />,
    );
    expect(screen.getByRole("tab", { name: "A" })).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(screen.getByRole("tab", { name: "A" }), { key: "ArrowRight" });
    expect(onChange).toHaveBeenCalledWith("b");
  });

  it("Accordion uses native details/summary", () => {
    render(<Accordion items={[{ id: "1", title: "Shipping", content: "2–3 days", defaultOpen: true }]} />);
    expect(screen.getByText("Shipping").closest("summary")).not.toBeNull();
    expect(screen.getByText("Shipping").closest("details")).toHaveAttribute("open");
  });

  it("Drawer is a labelled modal dialog, inert when closed, closes on Escape", () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <Drawer open={false} onClose={onClose} title="Your bag">
        <p>Lines</p>
      </Drawer>,
    );
    // closed: inert (browsers drop it from the a11y tree and tab order)
    expect(screen.getByRole("dialog", { hidden: true })).toHaveAttribute("inert");
    rerender(
      <Drawer open onClose={onClose} title="Your bag" count={2}>
        <p>Lines</p>
      </Drawer>,
    );
    expect(screen.getByRole("dialog", { name: /Your bag/ })).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("button", { name: "Close bag" })).toHaveFocus();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("Dialog and Toast render accessible containers", () => {
    render(
      <>
        <Dialog open onClose={() => {}} label="Details">
          <p>Body</p>
        </Dialog>
        <Toast open message="Added to your bag" action={{ label: "View bag", onClick: () => {} }} />
      </>,
    );
    expect(screen.getByRole("dialog", { name: "Details" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Added to your bag");
    expect(screen.getByRole("button", { name: "View bag" })).toBeInTheDocument();
  });

  it("AnnouncementBar and Subnav", () => {
    render(
      <>
        <AnnouncementBar href="/new">
          New: <b>The Scent Society</b>
        </AnnouncementBar>
        <Subnav
          label="Shop by"
          items={[
            { label: "For Her", href: "/her", color: "peach", current: true },
            { label: "Under AED 99", href: "/u99", color: "pink", sale: true },
          ]}
          info="Free delivery over AED 100"
        />
      </>,
    );
    expect(screen.getByRole("link", { name: "New: The Scent Society" })).toHaveAttribute("href", "/new");
    expect(screen.getByRole("navigation", { name: "Shop by" })).toBeInTheDocument();
    const her = screen.getByRole("link", { name: "For Her" });
    expect(her).toHaveAttribute("aria-current", "page");
    expect(her.style.getPropertyValue("--c")).toBe("var(--sapil-p-peach)");
  });
});
