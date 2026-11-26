"use client";

import type { ReactNode } from "react";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { splitLinks } from "../lib/linkify";

/** A line that starts a list item: "- x", "• x", "* x", "1. x" or "1) x". */
const BULLET = /^\s*(?:[-•*]|\d+[.)])\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+/;

/** Links and our own paths inside a piece of plain text. Nothing but https links and our own paths becomes a link. */
function Linked({ text }: { text: string }): ReactNode {
  const copy = useShopCopy();
  return splitLinks(text).map((part, index) => {
    if (part.kind === "path") {
      // Named, so a shopper never reads an address like /track in a reply.
      const label = part.value.toLowerCase().startsWith("/track")
        ? copy("assistant.link.track")
        : copy("assistant.link.page");
      return (
        <LocaleLink key={index} href={part.value} className="font-medium underline underline-offset-2">
          {label}
        </LocaleLink>
      );
    }
    if (part.kind === "url") {
      return (
        <a key={index} href={part.value} target="_blank" rel="noopener noreferrer" className="underline">
          {part.value}
        </a>
      );
    }
    return <span key={index}>{part.value}</span>;
  });
}

/** "**bold**" becomes bold; everything else is text. No HTML is ever read from a reply. */
function Inline({ text }: { text: string }): ReactNode {
  const parts = text.split(/\*\*([^*\n]+)\*\*/g);
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <strong key={index} className="font-semibold">
        {part}
      </strong>
    ) : (
      <Linked key={index} text={part} />
    ),
  );
}

type Block = { kind: "p"; lines: string[] } | { kind: "list"; ordered: boolean; items: string[] };

/** Paragraphs on blank lines; consecutive list lines become one list; a single line break stays a line break. */
export function replyBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  for (const paragraph of text.replace(/\r\n/g, "\n").split(/\n{2,}/)) {
    let current: Block | null = null;
    for (const line of paragraph.split("\n")) {
      if (!line.trim()) continue;
      const item = BULLET.exec(line);
      if (item) {
        const ordered = NUMBERED.test(line);
        if (current && current.kind === "list" && current.ordered === ordered) current.items.push(item[1]);
        else {
          current = { kind: "list", ordered, items: [item[1]] };
          blocks.push(current);
        }
      } else if (current && current.kind === "p") {
        current.lines.push(line);
      } else {
        current = { kind: "p", lines: [line] };
        blocks.push(current);
      }
    }
  }
  return blocks;
}

/** A reply as readable text: short paragraphs, real lists and bold where the reply asks for it. */
export function ReplyText({ text }: { text: string }) {
  const blocks = replyBlocks(text);
  if (blocks.length === 0) return <p className="m-0" />;
  return (
    <div className="space-y-2 break-words" data-reply-text>
      {blocks.map((block, index) =>
        block.kind === "p" ? (
          <p key={index} className="m-0">
            {block.lines.map((line, i) => (
              <span key={i}>
                {i > 0 ? <br /> : null}
                <Inline text={line} />
              </span>
            ))}
          </p>
        ) : block.ordered ? (
          <ol key={index} className="m-0 list-decimal space-y-1 ps-5">
            {block.items.map((item, i) => (
              <li key={i}>
                <Inline text={item} />
              </li>
            ))}
          </ol>
        ) : (
          <ul key={index} className="m-0 list-disc space-y-1 ps-5">
            {block.items.map((item, i) => (
              <li key={i}>
                <Inline text={item} />
              </li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
}
