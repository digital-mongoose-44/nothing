# User Story: Radio Traffic Playback with Speaker-Identified Synchronized Transcription

**As a** user
**I want to** request radio traffic by typing a command in the chat and receive a playback response with synchronized transcription
**So that** I can listen to the audio and understand which participant said what

## Acceptance Criteria

- [ ] The user can request radio traffic by typing a message such as "Give me the radio traffic for ..." in the chat input
- [ ] The system responds with a chat message containing an embedded audio player and transcription
- [ ] The transcription is displayed alongside or below the audio player
- [ ] Each segment of the transcription is labeled with the speaker's callsign
- [ ] When a speaker cannot be identified, the callsign is displayed as "Unknown"
- [ ] The current word or phrase in the transcription is highlighted as the audio plays
- [ ] The transcription automatically scrolls to keep the highlighted text visible
- [ ] Playback controls (play, pause, seek) update the transcription highlight position accordingly

# Tasks for Radio Traffic Playback with Speaker-Identified Synchronized Transcription

## Task 1: Implement Radio Traffic UI Element Detection

**Description:** Create logic to detect when the LLM's response contains a UI element with type "radio", enabling the chat interface to render the appropriate radio traffic playback component.

**Acceptance Criteria:**

- Function that parses LLM response and identifies UI elements with type: "radio"
- Extracts relevant data payload from the UI element (audio URL, transcription segments, metadata)
- Returns typed object matching existing radio traffic types when detected
- Returns null/undefined when no radio UI element is present
- Handles malformed or incomplete UI element data gracefully with appropriate error logging

---

## Task 2: Create API Integration Service for Radio Traffic

**Description:** Implement the service layer that calls the backend API to fetch radio traffic data.

**Acceptance Criteria:**

- Async function to fetch radio traffic from backend API using existing contract
- Proper error handling with typed error responses
- Loading state management
- Request cancellation support for abandoned requests

**Dependencies:** None

**Estimated effort:** Small

---

## Task 3: Build Audio Player Component

**Description:** Create a reusable audio player component with standard playback controls.

**Acceptance Criteria:**

- Play/pause button with appropriate icons
- Seek bar showing progress and allowing click-to-seek
- Current time and total duration display
- Exposes currentTime via callback or ref for synchronization
- Handles audio loading and error states
- Accessible with keyboard controls and ARIA labels

**Dependencies:** None

**Estimated effort:** Medium

---

## Task 4: Build Transcription Display Component

**Description:** Create a component that renders transcription segments with speaker labels.

**Acceptance Criteria:**

- Displays list of transcription segments
- Each segment shows speaker callsign as label (styled distinctly)
- "Unknown" displayed when speaker is not identified
- Accepts currentTime prop to determine which segment/word is active
- Visual distinction between different speakers (color coding or similar)
- Proper semantic HTML structure for accessibility

**Dependencies:** None

**Estimated effort:** Medium

---

## Task 5: Implement Word-Level Highlight Synchronization

**Description:** Add logic to highlight the current word or phrase based on audio playback position.

**Acceptance Criteria:**

- Calculates which word/phrase should be highlighted based on currentTime
- Applies highlight styling to active text
- Smooth transition between highlighted words
- Handles edge cases (seeking, rapid playback changes)
- Performance optimized to avoid excessive re-renders

**Dependencies:** Task 3, Task 4

**Estimated effort:** Medium

---

## Task 6: Implement Auto-Scroll for Transcription

**Description:** Add automatic scrolling behavior to keep highlighted text visible during playback.

**Acceptance Criteria:**

- Transcription container scrolls to keep highlighted segment in view
- Smooth scrolling animation
- Does not interfere with manual user scrolling (pause auto-scroll when user scrolls manually)
- Resumes auto-scroll when playback continues after user interaction
- Works correctly when seeking to different positions

**Dependencies:** Task 4, Task 5

**Estimated effort:** Medium

---

## Task 7: Create Composite Radio Traffic Response Component

**Description:** Build the combined component that embeds audio player and synchronized transcription together.

**Acceptance Criteria:**

- Integrates audio player and transcription components
- Manages shared playback state between components
- Proper layout (transcription alongside or below player as per design)
- Responsive design for different viewport sizes
- Loading skeleton while data is being fetched
- Error state display when radio traffic cannot be loaded

**Dependencies:** Task 3, Task 4, Task 5, Task 6

**Estimated effort:** Medium

---

## Task 8: Integrate Radio Traffic Response into Chat Interface

**Description:** Connect the radio traffic detection, API service, and response component into the existing chat flow.

**Acceptance Criteria:**

- Chat input triggers radio traffic detection (Task 1)
- Successful detection calls API service (Task 2)
- Response renders as embedded message in chat using composite component (Task 7)
- Loading indicator shown while fetching
- Error messages displayed appropriately in chat
- Multiple radio traffic responses can exist in same chat session

**Dependencies:** Task 1, Task 2, Task 7

**Estimated effort:** Medium

---

## Task 9: Write Unit Tests for Core Logic

**Description:** Create unit tests for request detection, time synchronization, and data transformation logic.

**Acceptance Criteria:**

- Tests for radio traffic request detection with various input phrasings
- Tests for word/segment highlight calculation at different timestamps
- Edge case coverage (empty transcription, single segment, missing speakers)
- Minimum 80% code coverage for utility functions

**Dependencies:** Task 1, Task 5

**Estimated effort:** Medium

---

## Task 10: Write Integration Tests for Radio Traffic Flow

**Description:** Create integration tests covering the complete user flow from request to playback.

**Acceptance Criteria:**

- Test: user types request → API called with correct parameters
- Test: response renders audio player and transcription
- Test: playback updates highlight position
- Test: seek action updates transcription highlight
- Test: error states handled correctly
- Mock API responses for consistent test behavior

**Dependencies:** Task 8

**Estimated effort:** Medium

---

## Summary

| Task | Description                     | Dependencies | Effort |
| ---- | ------------------------------- | ------------ | ------ |
| 1    | Request Detection Logic         | None         | Medium |
| 2    | API Integration Service         | None         | Small  |
| 3    | Audio Player Component          | None         | Medium |
| 4    | Transcription Display Component | None         | Medium |
| 5    | Word-Level Highlight Sync       | 3, 4         | Medium |
| 6    | Auto-Scroll Implementation      | 4, 5         | Medium |
| 7    | Composite Response Component    | 3, 4, 5, 6   | Medium |
| 8    | Chat Interface Integration      | 1, 2, 7      | Medium |
| 9    | Unit Tests                      | 1, 5         | Medium |
| 10   | Integration Tests               | 8            | Medium |

---

## Dependency Graph

```
Task 1 (Request Detection) ──────────────────────┐
                                                 │
Task 2 (API Service) ────────────────────────────┤
                                                 │
Task 3 (Audio Player) ───────┐                   │
                             ├─► Task 5 ──┐      │
Task 4 (Transcription) ──────┤            │      │
                             │            ├─► Task 7 ─► Task 8 ─► Task 10
                             │            │
                             └─► Task 6 ──┘
                                   │
Task 1 ──────────────────────────────────────────┴─► Task 9
Task 5 ──────────────────────────────────────────────┘
```
