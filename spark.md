# King of War - Web Game Spark Analysis

## Product Vision
Transform "The King of War" physical board game into a browser-based multiplayer web game. The game combines Monopoly-style real estate acquisition with military strategy and combat, set in a post-apocalyptic warlord setting.

## Source Material Summary
The King of War is a fully designed and playtested physical board game with:
- Complete rulebook (7-page strategic rulebook)
- Physical board, cards, tokens, dice, and commander pieces
- Positive player feedback (average scores 4-5/5 across clarity, strategic depth, and overall experience)
- Military propaganda poster aesthetic (dark olive green theme)

## Core Game Mechanics

### 1. Board & Movement
- Circular board path (Monopoly-style) with named locations: Ironclad City, Trenchtown Village, Frostfang Castle, Supply Point, etc.
- 2-6 players, each with a colored Commander Model piece
- Roll two dice to move clockwise; doubles ("double roll") grant an extra move
- Game starts at "Supply Station" (Starting Point)

### 2. Land & Economy System
- **Unoccupied land**: Player can choose to purchase at listed price using "Cannon Coins" (game currency)
- **Own land**: Can build constructions or upgrade
- **Enemy land**: Must pay rent/tax to the owner
- **Selling land**: Players can sell owned land at selling price (less than purchase price) to raise funds
- **Bankruptcy**: If a player cannot pay fees after selling all assets, they are eliminated

### 3. Military Unit Management
- **Recruitment**: Spend Agron Coins to recruit units (infantry, tanks, aircraft) into "Reserve Force Pool"
- **Mobile Army**: Deploy units from reserve pool to commander's position - moves with commander, main attacking force
- **Garrison Forces**: Deploy units from reserve pool to any owned territory - stays on that plot, main defensive force
- **Management Phase**: Freely transfer units between commander (mobile) and territories (garrison)

### 4. Combat System
- **Trigger**: When a player moves onto enemy-occupied territory
- **Types**:
  - *Military Battle*: Attacker uses "stationary troops" for combat
  - *Costly Battle*: Pay the "tax" amount + play a "card" to the land owner
- **Battle Resolution**:
  - Both sides roll dice + add combat power of all units
  - Higher total wins; defender wins ties
  - Loser removes units from the losing side proportionally
- **Combat Retreat**: Attacker can retreat, losing some units in the process
- **Fog of War**: Hidden information about garrison strengths

### 5. "Last Ammunition" Event Cards
- Deck of special event cards shuffled and placed face-down
- Drawn at specific board locations or triggered by events
- Card types include:
  - **Mercenary**: Hire battle mercenary for one fight, +2 combat strength
  - **Dummy Supplies**: +1 combat strength for next battle
  - **Fuse Mine**: Trap card for defense
  - **Land Tax**: Instant - land lord gets 2 gold from one city owned
  - **War Fund**: Get 4 gold coins (for player)
  - **Surprise Attack**: Offensive advantage card
  - **Surrounded**: In battle, the enemy's formation will be encircled
  - **Transport Aircraft**: Instantly teleport to any plot of land
  - **Repressive**: Cost of 5 coins
  - **Military Investigation**: Impossible for one round
  - **Mobilisation of Militia**: Instant: recruit at no cost as if on a given strategically

### 6. Special Locations
- **Supply Station**: Starting point, may receive supplies/income when passing
- Various named territories with different costs, tax rates, and strategic value

### 7. Victory Condition
- Last player remaining wins and becomes the "King of War"
- Players eliminated when bankrupt (cannot pay fees after selling all assets)

## Game Setting / Lore
In the not-too-distant future, the old national order collapsed, and international alliances became ineffective. Countless wars destroyed cities and civilizations, leaving fragmented wastelands. Warlords rose like wolves, competing for cities, fortresses, and supply stations. Mysterious "lost armaments" (Cold War-era super weapons or future technology prototypes) are scattered across battlefields. Only one person can emerge victorious and become the true "Warlord King."

## Target Platform
- **Browser-based web game** (desktop-first, responsive)
- Real-time multiplayer with lobby/room system
- Single-player vs AI option

## Visual Style (from source material)
- **Dark military olive green** color palette
- **War propaganda poster** aesthetic
- Retro military typography
- Card art with military illustrations (soldiers, tanks, aircraft)
- Board rendered as a stylized war map with territory zones

## User Input / Raw Request
"Turn this into a web game" - User provided complete board game design package including rulebook, card designs, board layout, background lore, design content tree, reference analysis, playtest photos, and player feedback data.

## Key Technical Challenges
1. **Real-time multiplayer**: Synchronizing board state, dice rolls, combat resolution across players
2. **Complex game state**: Territory ownership, unit positions (mobile vs garrison), player economies, card hands
3. **Combat system**: Dice rolling + unit power calculation + fog of war for hidden garrisons
4. **AI opponents**: For single-player mode, AI needs to handle economic decisions, military deployment, and combat choices
5. **Board rendering**: Interactive circular board with clickable territories, animated movement, visual unit indicators

## Competitive Landscape (Board Game Web Adaptations)
- **Colonist.io** (Catan online) - Territory-based strategy
- **Monopoly GO** - Digital Monopoly with mobile-first
- **Risk: Global Domination** - Military conquest board game online
- **Tabletop Simulator** - Generic board game platform
- King of War uniquely combines Monopoly economics WITH military unit management and combat - a hybrid not well-served by existing digital offerings

## Scope Considerations
- **MVP**: 2-4 player hot-seat or real-time multiplayer with core mechanics (movement, land purchase, basic combat, event cards)
- **Phase 2**: AI opponents, ranked matchmaking, cosmetics
- **Phase 3**: Mobile optimization, tournaments, spectator mode

## Assets Available
- Card artwork (Mercenary, Dummy Supplies, Fuse Mine, Land Tax, War Fund, Surprise Attack, Surrounded, Transport Aircraft, Repressive, Military Investigation, Mobilisation of Militia)
- Board layout reference images
- Background/logo artwork
- Complete rulebook for implementation reference
- Player feedback data for balancing
