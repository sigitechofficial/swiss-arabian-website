"use client";

import { useState } from "react";

import { Reveal } from "@/components/motion";
import { DisclaimerNote } from "@/features/gift-box/components/DisclaimerNote";
import { NewsletterSection } from "@/features/home/components/NewsletterSection";
import { FragrancePickerSection } from "@/features/subscriptions/components/FragrancePickerSection";
import { HowSubscribeSection } from "@/features/subscriptions/components/HowSubscribeSection";
import { QueuePanel } from "@/features/subscriptions/components/QueuePanel";
import { SubscribePlanSection } from "@/features/subscriptions/components/SubscribePlanSection";
import { SubscriptionFaq } from "@/features/subscriptions/components/SubscriptionFaq";
import { SubscriptionHero } from "@/features/subscriptions/components/SubscriptionHero";
import { WhySubscribeSection } from "@/features/subscriptions/components/WhySubscribeSection";
import {
  QUEUE_CAPACITY,
  type QueueProduct,
  queueCatalog,
} from "@/features/subscriptions/data/subscriptionContent";

function emptyQueue(): Array<QueueProduct | null> {
  return Array.from({ length: QUEUE_CAPACITY }, () => null);
}

/** Subscription page — Figma 335:3244 */
export function SubscriptionsPageView() {
  const [gender, setGender] = useState<"male" | "female">("male");
  const [chooseFragrances, setChooseFragrances] = useState(true);
  const [queue, setQueue] = useState<Array<QueueProduct | null>>(() => {
    const slots = emptyQueue();
    slots[0] = queueCatalog[0] ?? null;
    slots[1] = queueCatalog[1] ?? null;
    slots[2] = queueCatalog[2] ?? null;
    return slots;
  });

  function addToQueue(product: QueueProduct) {
    setQueue((prev) => {
      if (prev.some((slot) => slot?.id === product.id)) return prev;
      const next = [...prev];
      const emptyIndex = next.findIndex((slot) => slot == null);
      if (emptyIndex === -1) return prev;
      next[emptyIndex] = product;
      return next;
    });
    setChooseFragrances(true);
  }

  function removeById(productId: string) {
    setQueue((prev) =>
      prev.map((slot) => (slot?.id === productId ? null : slot)),
    );
  }

  function removeAt(index: number) {
    setQueue((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  }

  function handleSubscribe() {
    const picker = document.getElementById("fragrance-picker");
    if (chooseFragrances && picker) {
      picker.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <div className="bg-page">
      <Reveal fade>
        <SubscriptionHero />
      </Reveal>
      <Reveal>
        <WhySubscribeSection />
      </Reveal>
      <Reveal>
        <HowSubscribeSection />
      </Reveal>
      <Reveal>
        <SubscribePlanSection
          gender={gender}
          onGenderChange={setGender}
          chooseFragrances={chooseFragrances}
          onChooseFragrancesChange={setChooseFragrances}
          onSubscribe={handleSubscribe}
        />
      </Reveal>

      {chooseFragrances ? (
        <Reveal>
          <div id="fragrance-picker" className="px-4 sm:px-6 lg:px-10">
            <FragrancePickerSection
              queue={queue}
              onAdd={addToQueue}
              onRemoveById={removeById}
            />
            <QueuePanel
              queue={queue}
              onRemoveAt={removeAt}
              onSubscribe={handleSubscribe}
            />
          </div>
        </Reveal>
      ) : null}

      <Reveal>
        <SubscriptionFaq />
      </Reveal>

      <Reveal>
        <div className="pt-14">
          <DisclaimerNote />
          <NewsletterSection />
        </div>
      </Reveal>
    </div>
  );
}
