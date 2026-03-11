# King of War - User Stories

## Epic 1: Landing Page & Game Entry

### US-1.1: View Landing Page
**As a** visitor, **I want to** see an immersive landing page with the game title and a clear call to action, **so that** I understand what the game is and can start playing immediately.

**Acceptance Criteria:**
- [ ] Full-screen dark military olive green background (#2a3320)
- [ ] "KING OF WAR" title in large military stencil font
- [ ] Tagline "Build Your Empire. Command Your Army." displayed below title
- [ ] "Play Now" primary button prominently displayed
- [ ] "How to Play" secondary link visible
- [ ] Page loads in under 3 seconds
- [ ] Footer with game credits

### US-1.2: View How to Play
**As a** new player, **I want to** read a summary of the game rules before playing, **so that** I understand the turn structure, combat, cards, and victory condition.

**Acceptance Criteria:**
- [ ] Accessible from landing page and during gameplay (collapsible panel)
- [ ] Covers: turn phases (movement, action, management), combat resolution, card types, victory condition
- [ ] Clean, readable layout with section headers
- [ ] Close/collapse button to return to game

---

## Epic 2: Lobby & Room System

### US-2.1: Create Game Room
**As a** player, **I want to** create a new game room with configurable settings, **so that** I can set up a game the way I want.

**Acceptance Criteria:**
- [ ] Settings available: player count (2-4), game mode (Classic/Blitz), turn timer (30s/60s/90s/unlimited), AI fill toggle, private/public toggle
- [ ] Room is created on server (Durable Object) upon submission
- [ ] Creator enters waiting room automatically
- [ ] Private rooms generate a shareable room code
- [ ] Public rooms appear in the public room list

### US-2.2: Join Game Room
**As a** player, **I want to** join an existing game room by code or from the public list, **so that** I can play with friends or strangers.

**Acceptance Criteria:**
- [ ] Public room list shows: room name, player count, game mode, open slots
- [ ] Join button connects via WebSocket and enters waiting room
- [ ] Private room join via entering room code
- [ ] Error shown if room is full or game already started
- [ ] Player assigned a color upon joining

### US-2.3: Waiting Room
**As a** player in a waiting room, **I want to** see who has joined, adjust my name, and wait for the host to start, **so that** I know when the game will begin.

**Acceptance Criteria:**
- [ ] Shows all connected players with their assigned colors
- [ ] Host can start game when at least 2 players (or 1 player + AI)
- [ ] Host can toggle AI fill for empty slots
- [ ] Player can set their display name
- [ ] "Start Game" button (host only) initiates the game for all players
- [ ] AI players show themed names: "General Steel", "Commander Vex", "Warlord Ash"

---

## Epic 3: Game Board Rendering

### US-3.1: Render Classic Board
**As a** player, **I want to** see the circular game board with all territory and special tiles rendered in the military theme, **so that** I can visualize the game state.

**Acceptance Criteria:**
- [ ] Circular board path with 16-20 tiles arranged around a center area
- [ ] Territory tiles show: name, purchase cost, owner color border, building level icons
- [ ] Special tiles visually distinct: Supply Station, Last Ammunition draw, Recruitment Post, Tax Office
- [ ] Board center shows: current turn info, dice results area
- [ ] Dark olive green tactical map aesthetic with terrain markings
- [ ] SVG/CSS rendering, no canvas required

### US-3.2: Render Blitz Board
**As a** player in Blitz mode, **I want to** see a smaller board with ~10 tiles, **so that** the game is faster-paced.

**Acceptance Criteria:**
- [ ] ~10 tiles arranged in a smaller circular path
- [ ] Same visual style as Classic board
- [ ] Includes at least: 6 territory tiles, 1 Supply Station, 1 Last Ammunition draw, 1 Recruitment Post, 1 Tax Office

### US-3.3: Display Commander Pieces
**As a** player, **I want to** see all players' commander pieces on the board at their current positions, **so that** I know where everyone is.

**Acceptance Criteria:**
- [ ] Each player has a distinctly colored commander piece
- [ ] Pieces are visible on their current tile (stacked if multiple on same tile)
- [ ] Active player's piece is highlighted/pulsing
- [ ] Smooth sliding animation when a piece moves

### US-3.4: View Tile Details
**As a** player, **I want to** click or hover on a tile to see its full details, **so that** I can make informed decisions.

**Acceptance Criteria:**
- [ ] Right panel shows selected tile details: name, type, cost, rent, owner, building level
- [ ] For own territories: shows garrison composition (unit types and count)
- [ ] For enemy territories with garrison: shows "Garrisoned — ?" (fog of war)
- [ ] For enemy territories without garrison: shows "Undefended"
- [ ] Building upgrade cost shown for own unbuilt territories

---

## Epic 4: Turn Structure & Dice

### US-4.1: Roll Dice
**As the** active player, **I want to** roll two dice during my movement phase, **so that** I can move my commander.

**Acceptance Criteria:**
- [ ] "Roll Dice" button appears (or press Space) during movement phase
- [ ] Animated dice roll with 1.5 second duration
- [ ] Two dice values shown clearly (1-6 each)
- [ ] Commander piece moves clockwise by the total
- [ ] If doubles rolled, flag for extra turn after current actions complete

### US-4.2: Execute Turn Phases
**As the** active player, **I want to** proceed through Movement → Action → Management → End Turn in sequence, **so that** the game follows proper turn structure.

**Acceptance Criteria:**
- [ ] Current phase clearly indicated in UI header
- [ ] Movement phase: dice roll and movement
- [ ] Action phase: tile-based action (buy, pay rent, combat, draw card, recruit, pay tax)
- [ ] Management phase: deploy/transfer units, play non-combat cards, sell territories
- [ ] "End Turn" button to pass to next player
- [ ] If doubles were rolled, return to movement phase instead of ending
- [ ] Turn timer counts down per phase; auto-skip on timeout

### US-4.3: Turn Timer
**As a** player, **I want to** see a countdown timer for the active player's turn, **so that** the game doesn't stall.

**Acceptance Criteria:**
- [ ] Timer displays seconds remaining based on room settings
- [ ] Visual urgency indicator when <10 seconds remain (color change)
- [ ] Auto-skip phase if timer expires (no action taken for that phase)
- [ ] Timer resets at start of each phase

---

## Epic 5: Economy & Land

### US-5.1: Purchase Territory
**As the** active player landing on an unoccupied territory, **I want to** choose whether to purchase it, **so that** I can expand my empire.

**Acceptance Criteria:**
- [ ] Modal popup shows: territory name, cost, base rent, current coins
- [ ] "Buy" button deducts cost from coins and assigns ownership
- [ ] "Pass" button skips purchase
- [ ] Territory border changes to player's color after purchase
- [ ] Purchase blocked if player has insufficient coins (Buy button disabled)

### US-5.2: Pay Rent
**As a** player landing on an enemy territory without garrison, **I want to** automatically pay rent to the owner, **so that** the economic system works.

**Acceptance Criteria:**
- [ ] Rent calculated: base rent * building multiplier (1x/1.5x/2x/3x for levels 0/1/2/3)
- [ ] Coins deducted from landing player, added to territory owner
- [ ] Coin transfer animation shown
- [ ] Notification to both players showing rent amount
- [ ] If player cannot afford rent → trigger bankruptcy flow (US-5.5)

### US-5.3: Build Structures
**As the** active player on my own territory during action/management phase, **I want to** build or upgrade structures, **so that** I earn more rent.

**Acceptance Criteria:**
- [ ] Build options shown: Outpost (Level 1), Fortress (Level 2), Stronghold (Level 3)
- [ ] Each level costs a defined amount of coins
- [ ] Can only upgrade sequentially (0→1→2→3)
- [ ] Building icon appears on tile after construction
- [ ] Rent multiplier updates immediately

### US-5.4: Sell Territory
**As a** player during management phase, **I want to** sell one of my owned territories for 50% of purchase price, **so that** I can raise emergency funds.

**Acceptance Criteria:**
- [ ] List of owned territories shown with sell prices (50% of purchase cost)
- [ ] "Sell" button transfers coins and removes ownership
- [ ] Buildings on sold territory are lost (no refund for buildings)
- [ ] Garrison units on sold territory return to reserve pool
- [ ] Territory becomes unoccupied (neutral border color)

### US-5.5: Bankruptcy & Elimination
**As a** player who cannot pay a mandatory cost, **I want to** be prompted to sell territories, and eliminated if I still can't pay, **so that** the elimination mechanic works.

**Acceptance Criteria:**
- [ ] When player cannot afford payment, modal shows: "Insufficient funds — Sell territories to continue"
- [ ] Player can sell territories until they can afford the payment
- [ ] If player cannot raise enough after selling everything → "BANKRUPT" declaration
- [ ] Bankrupt player's remaining territories become unoccupied
- [ ] Bankrupt player's units are removed from the game
- [ ] Bankrupt player enters spectator mode
- [ ] If only 1 player remains → trigger victory (US-10.1)

### US-5.6: Collect Income at Supply Station
**As a** player passing or landing on Supply Station, **I want to** receive income coins, **so that** the economy has regular cash injection.

**Acceptance Criteria:**
- [ ] Player receives a defined salary amount when passing or landing on Supply Station
- [ ] Coin animation and notification shown
- [ ] Works during normal movement (not Transport Aircraft teleport)

---

## Epic 6: Military Units

### US-6.1: Recruit Units
**As a** player at a Recruitment Post or during management phase on owned territory, **I want to** spend coins to recruit infantry, tanks, or aircraft, **so that** I can build my military force.

**Acceptance Criteria:**
- [ ] Unit recruitment panel shows: Infantry (3 coins, 1 power), Tank (8 coins, 3 power), Aircraft (12 coins, 5 power)
- [ ] Click unit + quantity to recruit; coins deducted
- [ ] Units enter Reserve Force Pool immediately
- [ ] Cannot recruit if insufficient coins
- [ ] Reserve pool count updated in player panel

### US-6.2: Deploy Units to Mobile Army
**As a** player during management phase, **I want to** move units from my reserve pool to my mobile army, **so that** I have attacking power with my commander.

**Acceptance Criteria:**
- [ ] Select units from reserve pool to add to mobile army
- [ ] Units join mobile army at commander's current position
- [ ] Mobile army composition visible in player panel
- [ ] Mobile army is visible to all players on the board

### US-6.3: Deploy Units to Garrison
**As a** player during management phase, **I want to** deploy units from my reserve pool to any owned territory as garrison, **so that** I can defend my land.

**Acceptance Criteria:**
- [ ] Select target territory from list of owned territories
- [ ] Select units from reserve pool to garrison there
- [ ] Garrison units are hidden from other players (fog of war)
- [ ] Own garrison visible in tile details panel
- [ ] "?" icon shows on tile for enemy players

### US-6.4: Transfer Units Between Mobile and Garrison
**As a** player during management phase at my own territory, **I want to** transfer units between my mobile army and the garrison at that location, **so that** I can adjust my force distribution.

**Acceptance Criteria:**
- [ ] Only available when commander is on an owned territory
- [ ] Move units from mobile army → garrison at current tile
- [ ] Move units from garrison at current tile → mobile army
- [ ] Updated counts reflected immediately in UI

### US-6.5: View Force Overview
**As a** player, **I want to** see a summary of all my military forces (reserve, mobile, garrison per territory), **so that** I can plan my strategy.

**Acceptance Criteria:**
- [ ] Player panel shows: reserve pool count (by type), mobile army composition
- [ ] Expandable section showing garrison composition per owned territory
- [ ] Total force summary (total units, total combat power)

---

## Epic 7: Combat System

### US-7.1: Initiate Combat
**As the** active player landing on a garrisoned enemy territory, **I want to** choose between Military Battle, Costly Battle, or Retreat, **so that** I have strategic options.

**Acceptance Criteria:**
- [ ] Combat choice modal appears with three options:
  - "Military Battle" — fight with mobile army vs garrison
  - "Costly Battle" — pay rent + play a card to avoid combat
  - "Retreat" — go back, lose 1 random unit
- [ ] Costly Battle only available if player has enough coins AND at least 1 card
- [ ] Retreat disabled if Surrounded card was played on you
- [ ] Choice sent to server for validation

### US-7.2: Resolve Battle
**As a** combatant, **I want to** see the battle resolve with dice rolls and combat power calculations, **so that** I know the outcome.

**Acceptance Criteria:**
- [ ] Full-screen combat overlay appears
- [ ] Card play phase: both attacker and defender prompted to play combat cards (with timer)
- [ ] Attacker's units displayed (full info)
- [ ] Defender's garrison REVEALED for the first time during combat
- [ ] Both sides roll dice (animated)
- [ ] Totals calculated: dice + unit combat power + card bonuses
- [ ] Higher total wins, defender wins ties
- [ ] Loss calculation: difference 1-3 = lose 1 unit, 4-6 = lose 2, 7+ = lose all
- [ ] Losing side's weakest units removed first
- [ ] Results displayed clearly before overlay closes

### US-7.3: Capture Territory After Combat Victory
**As an** attacker who won a battle and destroyed all garrison units, **I want to** capture the territory and optionally leave units as garrison, **so that** I expand my domain.

**Acceptance Criteria:**
- [ ] After winning, prompt: "Leave garrison?" with unit selection from mobile army
- [ ] Selected units become garrison on captured territory
- [ ] Territory ownership changes to attacker (border color update)
- [ ] Building level preserved (attacker inherits buildings)
- [ ] If no garrison left, territory is owned but undefended

### US-7.4: Combat Retreat
**As an** attacker who chose to retreat, **I want to** move back to my previous position losing 1 random unit, **so that** I can disengage from a bad fight.

**Acceptance Criteria:**
- [ ] Commander moves back to previous tile position
- [ ] 1 random unit removed from mobile army
- [ ] If mobile army is empty, retreat still succeeds (no unit lost)
- [ ] Retreat blocked if opponent played "Surrounded" card

---

## Epic 8: Last Ammunition Event Cards

### US-8.1: Draw Event Card
**As a** player landing on a Last Ammunition tile, **I want to** draw a card from the deck, **so that** I gain a tactical advantage.

**Acceptance Criteria:**
- [ ] Card drawn from top of shuffled deck
- [ ] Card revealed with animation (flip/draw effect)
- [ ] Card added to player's hand
- [ ] If hand already at max (5), prompt to discard one card
- [ ] If deck is empty, shuffle discard pile to form new deck
- [ ] Card details shown (name, type, effect description)

### US-8.2: Play Combat Cards
**As a** combatant during battle, **I want to** play combat cards (Mercenary, Dummy Supplies, Surprise Attack, Surrounded) before dice roll, **so that** I can influence the battle.

**Acceptance Criteria:**
- [ ] During card play phase of combat, eligible combat cards highlighted in hand
- [ ] Mercenary: adds +2 combat power for this battle
- [ ] Dummy Supplies: adds +1 combat power for this battle
- [ ] Surprise Attack: attacker rolls 3 dice instead of 2 (attacker only)
- [ ] Surrounded: opponent cannot retreat (can be played by either side)
- [ ] Multiple cards can be played per battle
- [ ] Played cards go to discard pile
- [ ] Timer for card play phase (15 seconds)

### US-8.3: Play Non-Combat Cards
**As a** player during management phase, **I want to** play instant/economy/movement cards, **so that** I can gain advantages outside of battle.

**Acceptance Criteria:**
- [ ] Land Tax: receive 2 coins per owned territory
- [ ] War Fund: receive 4 coins immediately
- [ ] Transport Aircraft: select any tile on board → commander teleports there (triggers landing actions)
- [ ] Repressive: select a target player → they lose 5 coins (min 0)
- [ ] Military Investigation: select an enemy territory → garrison composition revealed to you until end of game
- [ ] Mobilisation of Militia: 2 infantry added to reserve pool for free
- [ ] Fuse Mine: select an owned territory → place mine (visible only to you). Next attacker takes -2 to their total before combat.
- [ ] Played cards go to discard pile

### US-8.4: View Hand
**As a** player, **I want to** see my hand of cards at the bottom of the screen with full details on hover/click, **so that** I can plan when to use them.

**Acceptance Criteria:**
- [ ] Cards displayed as a row at bottom of screen
- [ ] Card face shows: name, type icon, brief effect text
- [ ] Click/hover shows full effect description
- [ ] Cards playable in current context are highlighted; unplayable are dimmed
- [ ] Hand count shown (e.g., "3/5 cards")

---

## Epic 9: Fog of War & Information

### US-9.1: Hide Enemy Garrison Info
**As a** player, **I want** enemy garrison compositions to be hidden from me, **so that** the fog of war creates strategic tension.

**Acceptance Criteria:**
- [ ] Enemy territories with garrison show "?" icon (garrisoned but unknown strength)
- [ ] Enemy territories without garrison show no garrison indicator
- [ ] Own territories always show full garrison details
- [ ] Server never sends enemy garrison composition to client (except during combat reveal or Military Investigation)

### US-9.2: Reveal Garrison via Military Investigation
**As a** player who played Military Investigation, **I want to** see the full garrison composition of one enemy territory permanently, **so that** I can plan attacks.

**Acceptance Criteria:**
- [ ] After playing card, click an enemy territory to reveal
- [ ] Garrison composition (unit types and count) displayed on that tile's detail panel
- [ ] Revealed info persists for the rest of the game for that player
- [ ] Other players are NOT notified of the investigation

### US-9.3: Reveal Garrison During Combat
**As a** combatant, **I want** the defender's garrison to be revealed during the combat overlay, **so that** both sides can see the battle forces.

**Acceptance Criteria:**
- [ ] Defender's garrison composition shown in combat overlay
- [ ] This information is only revealed during the battle (not persisted after combat ends, unless attacker wins)
- [ ] All spectating players can see both sides during combat

---

## Epic 10: Victory & End Game

### US-10.1: Victory Screen
**As the** last remaining player, **I want to** see a victory screen declaring me the King of War, **so that** I feel the accomplishment.

**Acceptance Criteria:**
- [ ] Full-screen victory overlay with "KING OF WAR" title
- [ ] Winner's name and commander color displayed prominently
- [ ] Game stats: territories owned, battles won, coins earned, units recruited, turns played
- [ ] "Play Again" button returns to lobby
- [ ] "Back to Menu" button returns to landing page
- [ ] All players see the victory screen (winner highlighted, others see "Defeated")

### US-10.2: Spectator Mode for Eliminated Players
**As an** eliminated player, **I want to** continue watching the game, **so that** I can see how it ends.

**Acceptance Criteria:**
- [ ] Eliminated player sees full board (but still fog of war for garrisons)
- [ ] No action buttons (view-only)
- [ ] Chat still available
- [ ] Can leave game at any time

---

## Epic 11: AI Opponents

### US-11.1: AI Takes Turn
**As a** player in a game with AI opponents, **I want** the AI to take turns with reasonable strategy, **so that** single-player and partially-filled games are playable.

**Acceptance Criteria:**
- [ ] AI executes full turn sequence: roll, action, management, end turn
- [ ] AI has 1-2 second delay between actions (simulated thinking)
- [ ] AI actions are animated same as human players
- [ ] AI buys territories when affordable (cost < 60% of coins), prioritizing higher rent
- [ ] AI recruits units when coins > 20, balancing infantry for economy and tanks for defense
- [ ] AI deploys garrison to high-value territories, keeps mobile army for offense

### US-11.2: AI Combat Decisions
**As a** player, **I want** AI to make reasonable attack/defend/retreat decisions, **so that** battles feel fair and strategic.

**Acceptance Criteria:**
- [ ] AI attacks when mobile army power > 1.3x estimated garrison power
- [ ] AI retreats when odds are poor
- [ ] AI plays combat cards when beneficial (Mercenary, Surprise Attack)
- [ ] AI uses economy cards when low on coins (War Fund, Land Tax)
- [ ] AI places Fuse Mine on highest-value territories

---

## Epic 12: Multiplayer & Real-Time Sync

### US-12.1: WebSocket Connection
**As a** player in a game, **I want** real-time updates when other players take actions, **so that** I see the game state change live.

**Acceptance Criteria:**
- [ ] WebSocket connection established on game start
- [ ] All player actions broadcast to all clients within 100ms
- [ ] Game state updates reflected immediately (piece movement, ownership changes, coin transfers)
- [ ] Server is source of truth — client displays server state

### US-12.2: Reconnection Handling
**As a** player who lost connection, **I want to** rejoin the game within 2 minutes, **so that** I don't lose my progress.

**Acceptance Criteria:**
- [ ] Disconnected player's turn is auto-skipped until they reconnect
- [ ] Other players see "Player X disconnected" notification
- [ ] Reconnecting player receives full current game state
- [ ] After 2 minutes without reconnection, player is replaced by AI
- [ ] Reconnection uses same room code/URL

### US-12.3: In-Game Chat
**As a** player, **I want to** send text messages and quick reactions to other players, **so that** the game feels social.

**Acceptance Criteria:**
- [ ] Chat input at bottom-right of game screen
- [ ] Messages appear in scrollable chat log
- [ ] Pre-set quick messages available: "Good move!", "I'm coming for you!", "Nice battle!", "Let's team up"
- [ ] Messages broadcast to all players in room via WebSocket
- [ ] Chat available to spectators (eliminated players)

---

## Epic 13: Player Panel & HUD

### US-13.1: Player Economy Display
**As a** player, **I want to** see my coin balance, owned territory count, and net worth at a glance, **so that** I can track my economic position.

**Acceptance Criteria:**
- [ ] Left panel shows: coin balance (animated on change), territory count, total building value
- [ ] All players' coin balances visible (public information)
- [ ] Visual indicator for richest/poorest player

### US-13.2: Turn & Phase Indicator
**As a** player, **I want to** see whose turn it is and what phase they're in, **so that** I know what's happening.

**Acceptance Criteria:**
- [ ] Header shows: current player name + color, current phase name, turn number
- [ ] Active player's panel highlighted
- [ ] Phase transitions have brief notification ("Movement Phase", "Action Phase", etc.)

---

## Story Map Summary

| Epic | Stories | Priority | Module |
|------|---------|----------|--------|
| 1. Landing & Entry | US-1.1, US-1.2 | Must Have | 10 |
| 2. Lobby & Rooms | US-2.1, US-2.2, US-2.3 | Must Have | 7 |
| 3. Board Rendering | US-3.1, US-3.2, US-3.3, US-3.4 | Must Have | 1 |
| 4. Turn & Dice | US-4.1, US-4.2, US-4.3 | Must Have | 6 |
| 5. Economy & Land | US-5.1–US-5.6 | Must Have | 2 |
| 6. Military Units | US-6.1–US-6.5 | Must Have | 3 |
| 7. Combat | US-7.1–US-7.4 | Must Have | 4 |
| 8. Event Cards | US-8.1–US-8.4 | Must Have | 5 |
| 9. Fog of War | US-9.1–US-9.3 | Must Have | 3, 4 |
| 10. Victory & End | US-10.1, US-10.2 | Must Have | 10 |
| 11. AI Opponents | US-11.1, US-11.2 | Must Have | 8 |
| 12. Multiplayer Sync | US-12.1–US-12.3 | Must Have | 7 |
| 13. Player HUD | US-13.1, US-13.2 | Must Have | 9 |

**Total: 13 Epics, 35 User Stories**
