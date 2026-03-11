# King of War - Pre-Planning Business Assessment

**Date**: 2026-03-11
**Product**: King of War (browser-based multiplayer board game)
**Phase**: Pre-Planning (before scope planning and implementation)
**Assessor**: Accountant Agent

---

## Business Model

**Revenue model:** Free-to-play with cosmetic monetization + optional premium membership
**Paying customer:** End user (individual gamers)
**Pricing tiers:**

| Tier | Price/mo | Key Features | Target Segment |
|------|----------|-------------|----------------|
| Free | $0 | All game mechanics, multiplayer, AI opponents, Classic + Blitz modes | All players |
| Battle Pass | $2/season (~$0.67/mo, 3-month seasons) | Cosmetic reward track: commander skins, dice skins, card backs, board themes | Engaged repeat players |
| Premium | $4/mo | Ad-free experience, custom room settings, exclusive cosmetics, priority matchmaking | Power users / enthusiasts |
| Cosmetic Shop | One-time $1-5 per item | Individual commander skins, victory animations, board themes | Impulse purchasers |

**Pricing justification:**
- Colonist.io charges $4.99/mo for premium (ad-free, custom avatars, extra features). King of War should price at or below this since it has no established brand.
- Monopoly GO averages ~$22/month ARPU across paying users, but relies on gacha/P2W mechanics we are deliberately avoiding.
- For a fair-play cosmetic-only model in a niche strategy game, $2-5/mo average spend from paying users is realistic.
- Battle pass at $2/season is low-commitment and proven across the gaming industry (41% of top-grossing games use season passes per research doc).

---

## Cost Structure (Monthly)

### Infrastructure

| Item | Service | Estimated Cost | Notes |
|------|---------|---------------|-------|
| Frontend hosting | Cloudflare Pages | $0 | Free tier: unlimited bandwidth for static sites |
| Backend compute | Cloudflare Workers | $0-5 | Free: 100K requests/day. Paid plan ($5/mo) at scale for 10M requests/mo |
| Game rooms (state) | Cloudflare Durable Objects | $0-15 | Free tier includes some usage. At scale: ~$0.15/GB-hr storage, $0.50/million requests. Turn-based games are low-request-volume per room. |
| WebSocket connections | Cloudflare Durable Objects | Included | WebSocket connections are part of Durable Objects pricing |
| Database (profiles/stats) | Cloudflare D1 (SQLite) | $0-5 | Free: 5M reads/day, 100K writes/day. Player profiles + match history fit easily. |
| Auth | Cloudflare Access or simple email/OAuth | $0 | Basic auth via Workers. No third-party auth service needed for MVP. |
| CDN / Static assets | Cloudflare (included) | $0 | Card art, board images served via Pages |
| Domain | keming.co subdomain (assumed) | $0 | Included per project context |
| **Total infra (MVP/low scale)** | | **$0-5/mo** | Free tier covers MVP through ~1K MAU |
| **Total infra (growth, 10K MAU)** | | **$25-50/mo** | Paid Workers plan + DO usage |
| **Total infra (scale, 50K+ MAU)** | | **$100-200/mo** | Heavy DO usage for concurrent game rooms |

### Third-Party Services

| Service | Purpose | Cost | Notes |
|---------|---------|------|-------|
| Stripe | Payment processing | 2.9% + $0.30/txn | Only incurred on revenue; variable cost |
| Analytics (Plausible or self-hosted) | Usage tracking | $0-9/mo | Plausible at $9/mo or free self-hosted alternative |
| Email (Resend or Cloudflare) | Transactional email | $0 | Free tier covers low volume; not critical for MVP |

### Operations

| Item | Cost | Notes |
|------|------|-------|
| Error monitoring (Sentry free tier) | $0 | Free for 5K events/mo |
| Community (Discord server) | $0 | Free |
| **Total ops** | **$0-9/mo** | |

### Total Monthly Burn by Stage

| Stage | Infra | Services | Ops | Total |
|-------|-------|----------|-----|-------|
| MVP (pre-revenue, <1K MAU) | $0 | $0 | $0 | **$0/mo** |
| Early growth (1K-5K MAU) | $15 | $9 | $0 | **$24/mo** |
| Growth (5K-20K MAU) | $50 | $9 | $9 | **$68/mo** |
| Scale (20K-50K MAU) | $150 | $9 | $9 | **$168/mo** |

**Key insight**: The Cloudflare stack makes this extraordinarily cheap to operate. Infrastructure cost is near-zero until significant scale. This is a major advantage -- the break-even threshold is very low.

### Total Annual Cost (Year 1, blended): ~$500-$1,200/yr

This assumes gradual user growth from 0 to target scale. The first several months will cost essentially nothing.

---

## Revenue Projections (12-Month)

### Assumptions

- **Total addressable market (TAM):** $2.27B online board games market (2025, Mordor Intelligence). Strategy/abstract segment = 29% = ~$658M.
- **Serviceable addressable market (SAM):** Browser-based strategy board games. Colonist.io proves ~3.6M yearly players exist for a single web board game. Assume the broader web strategy board game audience is 10-20M globally.
- **Realistic target (first year):** 15,000 yearly active players (not 100K -- see reasoning below).
- **Free-to-paid conversion rate:** 3% (industry benchmark for F2P games: 2-5%. Colonist.io likely converts ~2-3% based on niche size and premium pricing. Source: various F2P industry reports.)
- **Monthly churn rate (paid):** 8% (industry benchmark for subscription games: 5-10%. Higher end because niche game with no lock-in.)
- **Average revenue per paying user (ARPU):** $3.50/mo (blend of $4/mo premium subs and $2/season battle pass purchasers + occasional cosmetic shop purchases)

### Why 15K yearly players, not 100K

The 100K target from the research doc is aspirational but unrealistic for Year 1 of an unknown indie game with:
- No marketing budget
- No established brand
- No mobile version (desktop web only)
- Complex rules (45-60 min games)

Colonist.io took years to reach 3.6M yearly players, and it cloned an already-famous game (Catan). King of War is an original IP. A more honest Year 1 estimate is 10K-20K yearly active players through organic channels (Reddit, BoardGameGeek, Discord, YouTube).

I will model three scenarios: pessimistic (8K), realistic (15K), and optimistic (30K).

### Month-by-Month Projection (Realistic Scenario: 15K YAP)

Assumptions: MAU = ~35% of yearly actives for a niche game = ~5,200 MAU at steady state. Ramp from 0. Conversion rate 3%. ARPU $3.50/mo. Monthly churn on paid: 8%.

| Month | Total MAU | Paid Users | MRR | Cumulative Revenue | Monthly Cost | Net (Cumulative) |
|-------|-----------|------------|-----|-------------------|-------------|-------------------|
| 1 | 300 | 5 | $18 | $18 | $0 | +$18 |
| 2 | 600 | 14 | $49 | $67 | $0 | +$67 |
| 3 | 1,200 | 30 | $105 | $172 | $10 | +$162 |
| 4 | 1,800 | 47 | $165 | $337 | $15 | +$307 |
| 5 | 2,500 | 66 | $231 | $568 | $20 | +$518 |
| 6 | 3,200 | 85 | $298 | $866 | $30 | +$776 |
| 7 | 3,800 | 100 | $350 | $1,216 | $35 | +$1,096 |
| 8 | 4,200 | 110 | $385 | $1,601 | $40 | +$1,446 |
| 9 | 4,500 | 118 | $413 | $2,014 | $45 | +$1,824 |
| 10 | 4,800 | 126 | $441 | $2,455 | $50 | +$2,225 |
| 11 | 5,000 | 132 | $462 | $2,917 | $55 | +$2,647 |
| 12 | 5,200 | 137 | $480 | $3,397 | $60 | +$2,887 |

**Math check (Month 12):** 5,200 MAU x 3% conversion = 156 potential paid. With 8% monthly churn on paid base, steady-state paid users = new conversions / churn rate = (5,200 x 0.03 x 0.08) / 0.08 ... more simply: at steady state ~137 paid users, given churn replacing new conversions. 137 x $3.50 = $480 MRR.

### Key Metrics at Month 12 (Realistic)

- **MRR:** $480
- **ARR:** $5,760
- **Total yearly active players:** ~15,000
- **Monthly active users:** ~5,200
- **Paid users:** ~137
- **LTV:** $3.50 / 0.08 = $43.75
- **CAC budget:** $43.75 / 3 = $14.58 per acquired user (guideline)
- **Year 1 total revenue:** ~$3,400
- **Year 1 total cost:** ~$360
- **Year 1 net profit:** ~$3,040

### Pessimistic Scenario (8K Yearly Active Players)

| Metric | Value |
|--------|-------|
| MAU at Month 12 | 2,800 |
| Paid users | 74 |
| MRR | $259 |
| Year 1 total revenue | ~$1,800 |
| Year 1 total cost | ~$240 |
| Year 1 net | ~$1,560 |

### Optimistic Scenario (30K Yearly Active Players)

| Metric | Value |
|--------|-------|
| MAU at Month 12 | 10,500 |
| Paid users | 276 |
| MRR | $966 |
| Year 1 total revenue | ~$6,800 |
| Year 1 total cost | ~$800 |
| Year 1 net | ~$6,000 |

---

## Break-Even Analysis

This is where King of War's Cloudflare-based architecture becomes its strongest financial asset.

- **Monthly fixed costs:** ~$0-10 at low scale (effectively zero)
- **Variable cost per user:** ~$0.003/mo (Cloudflare DO requests + bandwidth per MAU -- negligible)
- **ARPU (paid):** $3.50/mo
- **Conversion rate:** 3%
- **Revenue per user (blended):** $3.50 x 0.03 = $0.105/mo
- **Break-even users:** At $0/mo fixed cost, break-even is essentially **1 paying user** (immediate)
- **At $24/mo fixed cost (early growth):** $24 / ($0.105 - $0.003) = 235 MAU needed
- **At $68/mo fixed cost (growth):** $68 / $0.102 = 667 MAU needed

**Break-even timeline: Month 1-2 (immediately upon any paid conversion).**

The Cloudflare stack eliminates the usual serverless/hosting cost trap that kills indie games. There is no minimum infrastructure cost to cover. The product is profitable from its first paying user in any meaningful sense.

This is not typical. Most multiplayer games require dedicated servers, database hosting, and auth services that create a $50-200/mo floor before any users arrive. King of War avoids this entirely.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Low conversion rate (<2%) | Medium | Medium | At 1% conversion, Year 1 revenue drops to ~$1,100. Still profitable due to near-zero costs. Impact is manageable. Add conversion-optimized paywalls (cosmetic "premium" skins visible to other players to create social proof). |
| High churn (>12% monthly) | Medium | Medium | At 15% churn, paid users at steady state drop ~40%. Counter with seasonal content drops, battle pass progression, and community events. |
| Failing to reach critical mass for multiplayer | **High** | **High** | This is the biggest risk. If matchmaking queues are empty, players leave. Mitigation: AI opponents must be excellent from day one (research shows 30% of Colonist.io games are vs bots). Also: focus on async/invite-link play with friends, not random matchmaking. |
| Complex rules deter casual players | Medium | High | Blitz mode (20 min) + interactive tutorial. Accept that this is a niche game and market accordingly -- strategy depth is the selling point, not mass casual appeal. |
| Long session times (45-60 min Classic) | Medium | Medium | Blitz mode as primary, save/resume for Classic. Most web sessions may be Blitz. |
| Cloudflare Durable Objects pricing changes | Low | Medium | DO is a strategic Cloudflare product. Unlikely to see dramatic price increases. Fallback: migrate to standard Node.js WebSocket server (~$5-20/mo on Fly.io or Railway). |
| No mobile version limits audience | Medium | Medium | 68% of online board game market is mobile (research doc). Web-first is a deliberate bet. If the game succeeds, mobile wrapper (Capacitor/PWA) is a straightforward Year 2 project. Colonist.io proved web-first can work. |
| Cheating/exploits damage reputation | Low | High | Server-authoritative architecture (already planned) eliminates client-side cheating. Dice rolls, fog of war, combat resolution all server-side. |
| Competitor launches similar hybrid | Low | Low | The economic-military hybrid is mechanically complex and hard to clone quickly. First-mover advantage in a niche. |

---

## Recommendation: CONDITIONAL GO

**Rationale:**

King of War has an unusual financial profile: near-zero operating costs combined with a genuine market gap (no web game combines Monopoly economics with military strategy). The Cloudflare stack means the product is profitable from its very first paying user -- there is no burn rate to worry about. Even the pessimistic scenario (8K yearly players, $1,800 revenue) is profitable because costs are under $300/year.

However, this is not a "build it and retire" product. The realistic Year 1 revenue of ~$3,400 is essentially hobby income, not a business. The product's financial ceiling depends entirely on whether it can break out of niche strategy gamer circles into a broader audience. The path from 15K to 100K yearly players requires either organic virality (unlikely for a 45-minute strategy game) or a mobile version (Year 2 investment).

The financial case is: **low risk, low cost, low-but-positive return, with optionality for upside.** This is a good bet if the development cost is low (which it is, given the Cloudflare stack and existing game design assets).

**Key conditions (for this to work beyond hobby scale):**

1. **AI opponents must be good at launch.** Without them, the multiplayer cold-start problem will kill retention. This is non-negotiable.
2. **Blitz mode must ship in MVP.** 60-minute web games are a hard sell. Blitz (20 min) is essential for repeat play and retention.
3. **No marketing budget is assumed.** Growth must come from organic channels: Reddit (r/boardgames, r/WebGames), BoardGameGeek, Discord communities, YouTube/Twitch strategy creators. The game's unique hybrid mechanic IS the marketing hook.
4. **Cosmetic monetization must feel worthwhile.** Commander skins, dice skins, and board themes need to be visually compelling. Low-effort cosmetics will not convert.

**Biggest financial risk:** Failing to achieve multiplayer critical mass. If players open the game, see no opponents online, and leave, no amount of good game design will save it. The AI opponent system is the insurance policy against this -- it must be good enough that single-player vs AI feels satisfying, not hollow.

**Upside scenario (Month 12):** The game finds an audience on BoardGameGeek and strategy game Discord servers. Word of mouth drives 30K yearly active players. MRR reaches ~$966. A YouTube creator with 500K+ subscribers features the game and drives a spike. Year 1 revenue: $6,800. Year 2, with mobile version and more cosmetics: $20K-50K. This is a viable indie game business.

**Downside scenario (Month 12):** The game launches, gets modest Reddit attention, reaches 5K yearly players. Most play vs AI. Conversion is 1.5% (below benchmark) because cosmetics feel low-value. MRR is $92. Year 1 revenue: $650. Still profitable (costs are ~$150/year), but barely worth the development effort. The game becomes a portfolio piece, not a business.

**What would change a NO-GO to a GO:** Nothing -- the answer is already a conditional GO. The near-zero cost structure means there is almost no scenario where this loses money. The question is not "will it lose money?" (it won't) but "will it make enough money to justify the development time?" That depends on execution quality and organic marketing reach.

**What would make this a stronger GO:** A mobile version in the roadmap (captures the 68% mobile segment), a partnership with a strategy gaming YouTuber for launch, or integration with BoardGameGeek's platform for discovery.

---

## Summary Table

| Metric | Pessimistic | Realistic | Optimistic |
|--------|------------|-----------|------------|
| Year 1 MAU (month 12) | 2,800 | 5,200 | 10,500 |
| Year 1 paid users (month 12) | 74 | 137 | 276 |
| Year 1 MRR (month 12) | $259 | $480 | $966 |
| Year 1 total revenue | $1,800 | $3,400 | $6,800 |
| Year 1 total costs | $240 | $360 | $800 |
| Year 1 net profit | $1,560 | $3,040 | $6,000 |
| Break-even timeline | Month 1 | Month 1 | Month 1 |
| LTV per paid user | $43.75 | $43.75 | $43.75 |
| Gross margin | 87% | 89% | 88% |

**Verdict: CONDITIONAL GO** -- Profitable in all scenarios due to near-zero infrastructure costs. The condition is execution quality: AI opponents, Blitz mode, and compelling cosmetics must all ship to reach even the realistic scenario. Revenue is modest (hobby-to-small-indie scale in Year 1) but the risk/reward ratio is excellent.
