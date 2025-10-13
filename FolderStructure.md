# 🗂️ Project Folder Structure

This document explains the structure and purpose of each folder and key file within the `src/` directory of the project.

---

## 📁 src/

Root of all frontend source code. Contains entry points, assets, component logic, state management, utilities, and routing pages.

### 📄 App.tsx

Main app wrapper. Handles high-level layout or provider wrapping.

### 📄 main.tsx

Entry point that bootstraps the React app to the DOM.

### 📄 index.css, App.css

Global styles applied across the application.

---

## 📁 components/

Contains **reusable UI components** and **feature modules**.

### 🔹 Root Level Components

Used across multiple pages:

- 📄 `BlankApp.tsx` – The page shown when container is inactive.
- 📄 `Credit.tsx` – Global Level Credit component and fetching logic.
- 📄 `GithubModel.tsx` – GitHub connection per project.
- 📄 `HackathonPost.tsx` – Per post of Hackathon - reusable component.
- 📄 `HackathonShowcase.tsx` – Hackathon page component.
- 📄 `Image-upload-component.tsx` – Generation's big File attaching design and logic.
- 📄 `options.tsx` – Two CARD options in Index Page (Frontend and Fullstack).
- 📄 `pdfpreview.tsx` – Attached pdf's preview - reusable component.
- 📄 `PrizeModel.tsx` – Razorpay Payment Gateway.
- 📄 `ProjectGallery.tsx` – Gallery display for all users.
- 📄 `RewardModal.tsx` – Credit Reward Modal for new acount user's and for insufficient token.
- 📄 `UserDashboard.tsx` – User's posts.

### 📁 Supabase/

Components related to Supabase integration.

- 📄 `SupabaseConnection.tsx` – Supabase interface and `HOW TO GET ACCESS TOKEN` logic.

### 📁 ui/

Low-level Shadcn UI primitives shared across the app.

- 📄 `button.tsx`, `dialog.tsx`, `tooltip.tsx`, `alert-dialog.tsx` – Basic UI building blocks.

---

## 📁 context/

Holds React Context providers.

- 📄 `FrontendStructureContext.tsx` – Manages structure-related state globally.

---

## 📁 db/

Database-related details (not mandatory in frontend).

- 📄 `index.ts` – DB setup with Drizzle.
- 📄 `schema.ts` – DB schema definitions.

---

## 📁 helper/

Helpers shared across components/pages.

- 📄 `Toast.tsx` – Used to show user-facing toast notifications.

---

## 📁 hooks/

Custom React hooks.

- 📄 `chatpage_hooks.ts` – Entire App's control logic. Generation, Streaming, modification, Load convo, Load Project, FIle selection / removal, clipboard handling (e.g., UI control, message state).

---

## 📁 lib/

Pure utility logic and functions that don't rely on UI.

- 📄 `utils.ts` – Shadcn generated (not to be touched).

---

## 📁 pages/

Represents **route-based** components (used with routing library).

Each file or folder usually maps to a page/URL.

### 🔹 Top-Level Pages

- 📄 `Hackathon.tsx` – Main page for hackathon submission.
- 📄 `HackathonCompletionPage.tsx` – Hackathon Completed page.
- 📄 `NotFoundPage.tsx` – 404 page.
- 📄 `streaming.tsx` – Main page for hackathon submission.

---

### 📁 ChatPage/

Handles the `/chatpage/{projectId}` route.

#### 🔹 Files

- 📄 `ChatPage.tsx` – Main chat interface.

#### 📁 component/

Holds sections of the chat UI:

- 📄 `ChatSection.tsx` – Left CHat interface (resizable).
- 📄 `PreviewSection.tsx` – (iFrame Preview) / (Timer and Code tab).
- 📄 `ShareSection.tsx` – Deploying to Vercel handling (via Zustand).

#### 📁 utils/

- 📄 `displayCounter.ts` – Timer to show during Generation or activating the Sleeping Agent.

---

### 📁 Landing/

Homepage logic.

#### 📄 `Index.tsx`

Main landing page.

#### 📁 components/

Modular UI components for the landing page:

- 📄 `AnimatedTitle.tsx` – CodePup Title animation.
- 📄 `SignedOutMessage.tsx` – Message for non-logged-in users.

#### 📁 helper/

- 📄 `projectCardUtils.tsx` – Logic to support `ProjectCard` rendering.

#### 📁 hooks/

Landing-specific custom hooks:

- 📄 `useEvaluateRewards.tsx` – Calculates rewards logic (signup bonus display).
- 📄 `usehandleDeleteProject.ts` – CalculatesProject Deletion Logic.
- 📄 `usestartAnalyzeWorkflow.ts` – Starts **main** workflow of project generation from here. Image attachment, and extracted pdf append in request for `/analyze`.

#### 📁 services/

Handles backend API calls or logic.

- 📄 `creditsService.ts` - Fetch user's credit logic.
- 📄 `DeleteProject.ts` – APIAlert (2 step verification for deleting project).
- 📄 `handleLoadMoreProjects.ts` – Loads 4 more project.
- 📄 `handleProjectTypeSelect.ts` – Creation of project (frontend or fullstack).
- 📄 `handleSubmitService.ts` – Helper function.
- 📄 `imageSelectionService.ts` – HelperProcessing selected images.
- 📄 `syncUserAndFetchProjects.ts` - Fetches user before loading the landing page.

#### 📁 types/

- 📄 `types.ts` – Defines props/types for components in `Landing`.

#### 📁 utils/

- 📄 `displayStepUtils.ts`, `projectStatsUtils.ts` – Display logic and calculations.

---

## 📁 store/

Zustand state management for global and modular state.

### 📁 deployAndPublish/

- 📄 `deployAndPublishstore.ts` – Manages deployment-related states for frontend and fullstack.

---

## 📁 types/

Global types and interfaces used across the app.

- 📄 `index.ts` – App-wide types.
- 📄 `zustand.d.ts` – Zustand-specific TypeScript extensions.

---

## 📁 utils/

Contains **standalone utility functions** used throughout the app.

- 📄 `amplitude.ts` – Analytics tracking.
- 📄 `fileUpload.ts`, `fileValidation.ts` – File handling.
- 📄 `pdfExtraction.ts` – Logic for extracting images from PDFs.
- 📄 `workflowStateManager.ts` – Logic for managing a user's workflow state across sessions.
- 📄 `hashids.ts` – Hash ID generation for URL params.

---

## ✅ Summary

| Folder                      | Purpose                     |
| --------------------------- | --------------------------- |
| `components/`               | UI and feature components   |
| `pages/`                    | Route-based pages           |
| `hooks/`                    | Custom React hooks          |
| `utils/`, `lib/`, `helper/` | Logic and utility functions |
| `context/`                  | Shared global state         |
| `store/`                    | Zustand stores              |
| `types/`                    | TypeScript types            |
| `db/`                       | Schema and DB interface     |
| `assets/`                   | Images and static files     |

---
