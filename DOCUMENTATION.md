# Stray Cats Community App - Comprehensive Documentation

## 1. Overview & Purpose
**Stray Cats Community** is a mobile-first, offline-capable iOS application designed to help communities discover, track, and care for local stray cats. The app addresses the challenge of uncoordinated care for street animals by crowdsourcing data and providing a shared platform for cat lovers and TNR (Trap-Neuter-Return) volunteers.

**Core Value Proposition:**
- **Visibility**: Makes "invisible" street cats visible to the community.
- **Care Coordination**: Prevents overfeeding or neglect by tracking "Last Fed" times.
- **Population Control**: specifically highlights TNR status to aid rescue efforts.

## 2. Key Functionalities

### 🔍 Discovery & Tracking
- **Interactive Map**: A real-time map (centered on *The Pearl, Doha*) displaying cat variations nearby.
- **Smart Callouts**: utilizing a "Glass" overlay system, tapping a cat reveals critical stats immediately:
    - **Hunger Status**: Color-coded icon (Green = Fed recenty, Red = Hungry).
    - **Sighting Timestamp**: "Seen 10m ago" vs "Seen 3 days ago".
    - **TNR Shield**: Visual indicator of sterilization status.
- **Cat Profiles**: Detailed biometric data (Breed, Photos, Description) and history.

### 📝 Reporting System
- **Quick Sighting**: Rapidly log a new cat sighting.
- **Photo Integration**: Seamless integration with device camera roll to upload cat photos.
- **Geolocation**: Automatically tags sightings with coordinates (currently defaulting to Doha for demo).

### 🤝 Community
- **Social Feed**: A timeline of community updates, questions, and rescue success stories.
- **User Profiles**: gamified participation tracking (Sightings logged, Cats fed).

## 3. User Interface & Design System
The app features a **"Liquid Glass" (iOS 26 Concept)** aesthetic, characterized by:
- **Heavy Blur Effects**: Using native platform blur (`UIBlurEffect` via `expo-blur`) for depth.
- **Transparency**: Panels, tab bars, and cards are semi-transparent, allowing the rich background to bleed through.
- **Vibrant Colors**: A high-contrast neon palette against a dark background:
    - Primary Green: `#67CE67`
    - Accent Blue: `#3F8FF7`
    - Warning Yellow: `#F8D848`
    - Dark Canvas: `#20201E`
- **Floating Navigation**: A custom-built floating glass tab bar that sits above the content.

## 4. Technical Architecture

### 🏗 Frontend Architecture
- **Framework**: **React Native 0.81** with **Expo SDK 54**.
- **Routing**: **Expo Router** (File-based routing similar to Next.js).
    - `(tabs)`: Bottom tab layout for main navigation.
    - `modal`: Stack presentation for specialized flows like Reporting.
- **State Management**: React Hooks (`useState`, `useEffect`) and URL-based state for navigation.

### 💾 Data Layer (Local-First)
- **Database**: **SQLite** (via `expo-sqlite`).
- **Persistence**: Data is stored locally on the device, making the app fully functional offline.
- **Schema**:
    - `cats`: Stores cat profiles, coordinates, status, and image URIs.
- **Synchronization**: Designed for future syncing, but currently operates as a standalone local node.

### 🛠 Expo Functionalities Used
The app leverages the latest managed workflow capabilities of Expo SDK 54:
1.  **Expo Router (+ API Routes)**: For seamless native navigation and deep linking.
2.  **Expo Blur**: Powering the "Glass" UI components.
3.  **Expo SQLite**: Asynchronous and synchronous local DB methods (`openDatabaseSync`).
4.  **Expo Maps (react-native-maps)**: Native Apple Maps integration.
5.  **Expo Image Picker**: Handling media permissions and asset retrieval.
6.  **Expo Haptics**: Providing tactile feedback on interactions.
7.  **Expo Symbols**: Using SF Symbols for native iOS iconography (`expo-symbols`).

## 5. Development Workflow
- **Language**: TypeScript (Strict mode).
- **Styling**: `StyleSheet` with a centralized `Colors` configuration.
- **Components**: Atomic design with reusable `GlassView` and `GlassButton` primitives.
