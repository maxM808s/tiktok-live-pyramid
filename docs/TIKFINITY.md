# TikFinity Free integration evidence and limits

Research date: 2026-11-16. Official sources:

- [TikFinity Event API](https://tikfinity.zerody.one/tiktok/dapi)
- [Official German Event API page with endpoint and envelope](https://tikfinity.zerody.one/de/tiktok/dapi)
- [Official overlay page including Event API documentation](https://tikfinity.zerody.one/tiktok/obsoverlays)
- [TikFinity feature comparison and account setup](https://tikfinity.zerody.one/)

The official documentation describes a local desktop WebSocket at `ws://localhost:21213/`, with JSON `{ "event": "chat", "data": {} }`. It lists chat, gift, share, follow, like, roomUser and subscribe. The Desktop application must run on the same computer. Official Free/Pro feature comparison limits Actions & Events rules on Free; this implementation does not use those rules.

The public API documentation does not state a Pro prerequisite. That supports implementing the local Event API as the Free-compatible integration path; it is **not** proof of present account entitlement in every installed app release. No real Free desktop installation or TikTok LIVE session was available here. Therefore:

- Documentation, event envelope, endpoint and five selected event types: checked against official pages.
- Normalization, completed gift streak multiplication, ID deduplication and malformed input handling: locally executed tests.
- WebSocket transport and reconnection: verified only if the mock adapter test is recorded as passed in TEST-STATUS.md.
- Free-account access, real event field variants and real streaming delivery: **pending on your PC**.

No paid API, paid subscriptions, S2E, direct TikTok client, Pro purchase flow or subscription bypass is included. If Free access changes, this implementation fails visibly and retains its local simulator; it does not silently switch to paid services or an unsupported connector. There is no guaranteed Free live alternative without verifying another official Free method. TikFinity support can clarify your installed account's API availability.

## Normalization

The adapter accepts top-level identity and nested user identity, top-level gift fields and nested gift name/type, repeatCount/comboCount, and msgId/eventId/common.msgId. Gifts with giftType 1 are ignored until repeatEnd is the boolean true. Final quantity is multiplied once. Unknown gifts need an operator-defined mapping; coin value is not guessed.

Deduplication stores the latest 10,000 event IDs per process/checkpoint. Duplicate IDs inside that bounded cache are suppressed. Events with no stable ID cannot be reliably deduplicated; collapsing same-user/same-gift packets heuristically could discard legitimate purchases, so this project does not invent such a guarantee. Reconnect does not replay old events intentionally. TikFinity's own replay behavior must be checked live.

Socket connectivity and LIVE connectivity are distinct. A connected socket may be idle with no livestream. The UI exposes socket state and last-event time separately and does not label an empty open socket as a proven TikTok LIVE. Silence alone does not force a reconnect because an inactive audience is normal. A closed socket retries with bounded backoff. The adapter receives no account password.

## Local mock

`node tests/adapter-integration.mjs` creates a clearly labeled mock endpoint at 127.0.0.1:21213, emits the five documented event types, repeats a gift ID, closes its socket and checks reconnection. Run it only during development with TikFinity stopped, never during a real broadcast. Mock API Viewer is test data, never evidence of a real TikTok viewer.
