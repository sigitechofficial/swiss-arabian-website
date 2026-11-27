# Shopping assistant: guest chat and guest returns (website)

- The chat key: the server returns `guestId` on a guest's first message (or first return start); the widget keeps it in `localStorage` (`sa-assistant-guest`, `src/features/assistant/api/assistantGuest.ts`) and sends it as the `x-assistant-guest` header on every assistant call. The server stores only its hash. Clearing the chat deletes the saved chat.
- History: `GET /storefront/assistant/history` returns `saved` and `retentionDays` (set in the admin, default 30); the guest note shows the number of days.
- Guest return or exchange: the "Return or exchange an order" link in the guest note opens `GuestReturnForm` (kind, order number, code from the confirmation email). The code stays in the open widget's memory and goes with every flow request (`start`, `step`, `confirm`, `cancel`); it is never stored in the browser or by the server. A wrong number or code shows one neutral message (`assistant.guestReturn.notFound`). A guest request cannot be picked up again after the chat is closed.
- Messages: `assistant.guestNoteSaved`, `assistant.guestReturn.*` in `src/messages/en.json`.
- Full design: backend repo `docs/ai-assistant/ASSISTANT_RETURNS_EXCHANGES_PLAN.md`, section 18.
