# King of War - Web Game

## Pipeline Status
Current stage: launch (local preview) — ready for Cloudflare deploy when token available
Last updated: 2026-03-11

## Key Decisions
- Adapting physical board game "The King of War" into browser-based web game
- Source material located at: C:\Users\Administrator\Desktop\king of war\
- Complete rulebook, card art, board layout, and playtest data available

## Game Summary
Monopoly-style board movement + military unit management + combat system. 2-6 players compete to be last standing through economic and military dominance. Post-apocalyptic warlord setting.

## Core Mechanics
- Circular board, dice movement, land purchase/rent
- Military units: Reserve Pool -> Mobile Army (with commander) or Garrison (on territory)
- Combat: dice + unit power, attacker vs defender
- "Last Ammunition" event cards (11 types)
- Bankruptcy = elimination, last player wins

## Visual Style
- Dark military olive green palette
- War propaganda poster aesthetic
- Retro military typography

## Tech Stack
- React 18 + TypeScript + Vite: frontend
- Tailwind CSS v4 (@tailwindcss/vite plugin): styling
- Zustand: client state management
- SVG rendering for game board
- Playwright: visual testing
- Frontend runs on port 5180 in dev

## Source Assets
- 计划书/ (rulebook): 7 pages of rules
- 卡牌项目/WPS图片批量处理/: Card art + board images + background

## Server Implementation (completed)
- server/src/gameState.ts: Full game engine (createInitialState, processAction, createPlayerView)
- 83 tests passing across 6 test files
- Exports: createInitialState, processAction, getNextPhase, createPlayerView

## Gotchas
- Tailwind v4 uses @import "tailwindcss" and @theme block (not v3 @tailwind directives)
- handleLanding (tax/card-draw on tile) should NOT run during roll_dice — tests expect only supply income on wrap
- checkVictory must handle alive.length <= 1 (not just === 1) for edge case where all but creditor eliminated
- Deep clone state in processAction to avoid mutations across tests

## Frontend Screens (completed)
- Landing Page: military theme, PLAY NOW + MULTIPLAYER LOBBY
- Lobby: Create/Join room with game mode, player count, timer settings
- Game Screen: SVG board + player panels + card hand + actions + chat
- Combat Overlay: attacker vs defender, hidden garrison reveal, dice roll
- Victory Screen: winner stats, player ranking, play again
- How to Play: collapsible rules reference
