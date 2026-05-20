Original prompt: Build a 2D side-scrolling multiplayer racing game called 'Zawgyi Mythic Run' using Phaser.js for the frontend and Node.js with Socket.io for the backend.

Core Mechanics:

Characters: Zawgyi (Myanmar Alchemist) with skills: 'Levitate' (jump/fly), 'Staff Strike' (melee), and 'Alchemic Pill' (projectile).

Game Mode: Support both Single Player (vs AI) and Two-Player Local Multiplayer.

Controller: The PC browser displays the game. Players connect their smartphones via a local IP/URL (use Socket.io to send inputs like 'jump', 'attack', 'skill' from phone to PC).

Gameplay: A race through a mystical forest with obstacles and wild creatures. Attacking creatures gives a speed boost.

Technical Flow:

Create a Node.js server to serve the Phaser game.

Generate a unique Room ID or QR code link for mobile controllers.

Implement a responsive mobile UI with touch buttons for the controller.

Use basic placeholders for Zawgyi sprites for now.

Please provide the project structure and the initial code for server.js and game.js to get the movement synced.

Update 2026-02-06:
- Replaced frontend with new Zawgyi Mythic Run lobby, Phaser race scene, and controller wiring.
- Added server.js with Express + Socket.io room handling (host + 2 controllers).
- Added controller.html/controller.js/controller.css and updated index.html/styles.css.
- Added package.json with start script and dependencies.
- Implemented window.render_game_to_text and window.advanceTime hooks.

TODO:
- Run Playwright loop after starting server.
- Verify multiplayer inputs from controller in-game and confirm boosts on creature hits.
- Consider reconnect handling and polishing AI behavior.

Testing:
- npm install timed out (likely network blocked).
- node server.js failed: missing express (dependencies not installed).
- Playwright client failed: package 'playwright' not found.

Update 2026-02-06 (structure + gameplay pass):
- Moved client files into public/ and updated server static root.
- Added .env parsing + /host-info endpoint to prefer LAN IP/ HOST_URL for QR links.
- Reworked controller UI to joystick left + AB CD buttons right.
- Overhauled race gameplay: levitate ability with reduced gravity + vertical control, dash, obstacles, projectile slow on opponent.
- Added countdown start and parallax forest background.

Update 2026-02-06 (treasure hunt refactor):
- Replaced race logic with Treasure Hunt mode: free movement, collect 3 relics to win.
- Movement now honors joystick left/right and no auto-run.
- Levitate reduces gravity and allows vertical control while active.
- Added treasures, obstacles, and basic AI seeking nearest relic.
- Camera now centers between players; parallax retained.

Fix 2026-02-06:
- Forwarded joystick axis payload from server to host (controller:input now passes value).

Update 2026-02-06 (celebration):
- Added winner celebration overlay and particle burst when relic goal reached.
- Delayed result modal to let animation play.

Update 2026-02-06 (game length + rematch):
- Increased world size and treasures to win (5), added more platforms, obstacles, and relics.
- Added Rematch button to end screen.

Update 2026-02-06 (rematch + localStorage + stun):
- Fixed result overlay hidden state and ensured Rematch button shows.
- Persisted last mode and win counts to localStorage; wins shown in HUD.
- Added stun effect when hit by pill (1s freeze + flicker animation).

Update 2026-02-06 (treasure logic + end design):
- Unlimited treasure spawning with respawn delay and max active count.
- Win condition raised to 15; tie-breaker uses earliest finish time.
- Enhanced end screen styling and result copy with final score.
- Added celebration sparkle rain and scoreboard in celebration subtitle.

Update 2026-02-06 (crabs + camera):
- Added moving crab enemies that stun players for 1.5s on contact.
- Added camera zoom-to-fit both players and tether force to keep them in view.
- Updated win tie-breaker to avoid draw when finishing same frame.

Update 2026-02-06 (crabs + visuals):
- Adjusted crab height to sit on ground; added crab texture detail.
- Replaced log obstacles with bushes/trees.
- Improved projectile visuals with glow + trail and pulse tween.
- Added hero idle/run/jump animations with updated sprite frames.

Update 2026-02-06 (hazards + visuals):
- Added flying baby dragons that stun on contact and can be disabled by gun/fist.
- Fixed crab ground alignment; hazards now support dizzy/disabled state on hits.
- Replaced obstacle hit logic to dizzy/disable rather than destroy.
- Improved hero sprite frames and animations; projectile now wobbles with trail.

Update 2026-02-06 (aim + hazards + controller):
- Joystick aim now sets pill direction; projectiles can shoot backward/up/down.
- Win condition now requires 15 treasure + 5 crab + 5 flying fish.
- Added manual room ID entry on controller, plus debounce to prevent double taps.
- Added dancing winner in result UI.
- Added hazard hit counting for crabs/dragons; gun/fist disable hazards.

Testing:
- Unable to start server in sandbox (EPERM binding to 127.0.0.1:3001). Playwright tests not run.

Update 2026-02-06 (aim + win goals + controller + winner pose):
- Joystick aiming drives projectile direction (shoot any direction).
- Win condition: 15 treasure + 5 crabs + 5 flying fish; counts tracked in HUD.
- Controller allows room ID entry and debounces button presses.
- Added winner dancer in result UI.
- Added crab/dragon animations, levitate glow, staff slash, muzzle flash, and improved hero frames.

Update 2026-02-06 (refactor + controller stability):
- Split client into modules: public/js/main.js (lobby/socket) + public/js/game/scene.js (gameplay).
- Added iOS Safari fixes: disable selection/zoom gestures and debounce button presses.
- Controller now supports QR + manual room entry with reduced tap glitches.

Update 2026-02-06 (structure + controller i18n + weather + dive):
- Modularized client: public/js/main.js + public/js/game/scene.js loaded as ES module.
- Controller language toggle (EN/MM) with localStorage, plus iOS gesture/zoom suppression.
- Added weather cycle (clear/mist/rain/dusk) every 5 minutes.
- Added water zones for diving; underwater fish spawn and can be shot.
